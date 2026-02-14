import { useEffect, useMemo, useRef, useState } from "react";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

function upsertParticipant(list, participant) {
  const next = [...list];
  const index = next.findIndex((item) => item.socketId === participant.socketId);
  if (index >= 0) {
    next[index] = { ...next[index], ...participant };
    return next;
  }
  next.push(participant);
  return next;
}

export default function CollabHub({ socket, roomId, userName }) {
  const [openPanel, setOpenPanel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [inVoice, setInVoice] = useState(false);
  const [muted, setMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);

  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const audioRefs = useRef({});
  const listRef = useRef(null);

  const activeCount = useMemo(() => participants.length + (inVoice ? 1 : 0), [participants.length, inVoice]);

  const cleanupPeer = (socketId) => {
    const existing = peersRef.current.get(socketId);
    if (existing) {
      existing.close();
      peersRef.current.delete(socketId);
    }
    setRemoteStreams((prev) => prev.filter((item) => item.socketId !== socketId));
    setParticipants((prev) => prev.filter((item) => item.socketId !== socketId));
  };

  const createPeerConnection = (targetSocketId, targetName = "Guest") => {
    if (!socket || !localStreamRef.current) {
      return null;
    }

    if (peersRef.current.has(targetSocketId)) {
      return peersRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }
      socket.emit("voice-signal", {
        roomId,
        targetSocketId,
        signal: { type: "candidate", candidate: event.candidate },
      });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) {
        return;
      }
      setRemoteStreams((prev) => {
        const index = prev.findIndex((item) => item.socketId === targetSocketId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], stream };
          return next;
        }
        return [...prev, { socketId: targetSocketId, stream }];
      });
      setParticipants((prev) => upsertParticipant(prev, { socketId: targetSocketId, userName: targetName }));
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        cleanupPeer(targetSocketId);
      }
    };

    peersRef.current.set(targetSocketId, pc);
    return pc;
  };

  const createOfferTo = async (targetSocketId, targetName) => {
    const pc = createPeerConnection(targetSocketId, targetName);
    if (!pc) {
      return;
    }
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("voice-signal", {
      roomId,
      targetSocketId,
      signal: { type: "offer", sdp: pc.localDescription },
    });
  };

  const leaveVoice = () => {
    if (!inVoice || !socket) {
      return;
    }

    socket.emit("voice-leave", { roomId });
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    localStreamRef.current = null;
    setRemoteStreams([]);
    setParticipants([]);
    setInVoice(false);
    setMuted(false);
  };

  const joinVoice = async () => {
    if (!socket || inVoice) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setMuted(false);
      setInVoice(true);
      socket.emit("voice-join", { roomId, muted: false });
    } catch (_) {
      window.alert("Microphone access is required for voice chat.");
    }
  };

  const toggleMute = () => {
    if (!localStreamRef.current || !socket || !inVoice) {
      return;
    }
    const nextMuted = !muted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMuted(nextMuted);
    socket.emit("voice-mute", { roomId, muted: nextMuted });
  };

  useEffect(() => {
    const node = listRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  useEffect(() => {
    remoteStreams.forEach((item) => {
      const audio = audioRefs.current[item.socketId];
      if (audio && audio.srcObject !== item.stream) {
        audio.srcObject = item.stream;
      }
    });
  }, [remoteStreams]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const onChatMessage = (payload) => {
      setMessages((prev) => [...prev.slice(-79), payload]);
    };

    const onVoiceUsers = async ({ users }) => {
      const safeUsers = (users || []).filter((item) => item.socketId && item.socketId !== socket.id);
      setParticipants((prev) => {
        let next = [...prev];
        safeUsers.forEach((user) => {
          next = upsertParticipant(next, { socketId: user.socketId, userName: user.userName || "Guest", muted: false });
        });
        return next;
      });
      for (const user of safeUsers) {
        // New participant initiates offers to existing users.
        // eslint-disable-next-line no-await-in-loop
        await createOfferTo(user.socketId, user.userName || "Guest");
      }
    };

    const onVoiceUserJoined = ({ socketId, userName: joinedName, muted: joinedMuted }) => {
      if (!socketId || socketId === socket.id) {
        return;
      }
      setParticipants((prev) =>
        upsertParticipant(prev, {
          socketId,
          userName: joinedName || "Guest",
          muted: !!joinedMuted,
        })
      );
    };

    const onVoiceUserLeft = ({ socketId }) => {
      if (!socketId) {
        return;
      }
      cleanupPeer(socketId);
    };

    const onVoiceUserMuted = ({ socketId, muted: peerMuted }) => {
      setParticipants((prev) =>
        prev.map((item) => (item.socketId === socketId ? { ...item, muted: !!peerMuted } : item))
      );
    };

    const onVoiceSignal = async ({ fromSocketId, fromUserName, signal }) => {
      if (!fromSocketId || !signal) {
        return;
      }

      // Ignore signals until local audio stream is ready.
      // This avoids dropping early offers due to async React state timing.
      if (!localStreamRef.current) {
        return;
      }

      const pc = createPeerConnection(fromSocketId, fromUserName || "Guest");
      if (!pc) {
        return;
      }

      if (signal.type === "offer" && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("voice-signal", {
          roomId,
          targetSocketId: fromSocketId,
          signal: { type: "answer", sdp: pc.localDescription },
        });
      } else if (signal.type === "answer" && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === "candidate" && signal.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (_) {}
      }
    };

    socket.on("chat-message", onChatMessage);
    socket.on("voice-users", onVoiceUsers);
    socket.on("voice-user-joined", onVoiceUserJoined);
    socket.on("voice-user-left", onVoiceUserLeft);
    socket.on("voice-user-muted", onVoiceUserMuted);
    socket.on("voice-signal", onVoiceSignal);

    return () => {
      socket.off("chat-message", onChatMessage);
      socket.off("voice-users", onVoiceUsers);
      socket.off("voice-user-joined", onVoiceUserJoined);
      socket.off("voice-user-left", onVoiceUserLeft);
      socket.off("voice-user-muted", onVoiceUserMuted);
      socket.off("voice-signal", onVoiceSignal);
    };
  }, [socket, roomId]);

  useEffect(() => () => leaveVoice(), []);

  const submitChat = (e) => {
    e.preventDefault();
    if (!socket) {
      return;
    }
    const text = chatInput.trim();
    if (!text) {
      return;
    }
    socket.emit("chat-message", { roomId, message: text });
    setChatInput("");
  };

  return (
    <>
      <div className="pointer-events-none absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <button
          className={`pointer-events-auto rounded-xl border px-3 py-2 text-xs shadow-sm ${
            openPanel === "chat" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700"
          }`}
          onClick={() => setOpenPanel((prev) => (prev === "chat" ? null : "chat"))}
        >
          Chat
        </button>
        <button
          className={`pointer-events-auto rounded-xl border px-3 py-2 text-xs shadow-sm ${
            openPanel === "voice" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700"
          }`}
          onClick={() => setOpenPanel((prev) => (prev === "voice" ? null : "voice"))}
        >
          Voice {activeCount > 0 ? `(${activeCount})` : ""}
        </button>
      </div>

      {openPanel === "chat" && (
        <div className="pointer-events-none absolute right-20 top-1/2 z-30 hidden w-[300px] -translate-y-1/2 lg:block">
          <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="mb-2 text-sm font-semibold">Room Chat</div>
            <div ref={listRef} className="mb-2 h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {messages.length ? (
                messages.map((item) => (
                  <div key={item.id} className="mb-2">
                    <div className="text-[11px] font-semibold text-slate-700">{item.userName || "Guest"}</div>
                    <div className="text-xs text-slate-600">{item.message}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">No messages yet.</div>
              )}
            </div>
            <form className="flex gap-2" onSubmit={submitChat}>
              <input
                className="drawza-input !mb-0 !py-2 text-xs"
                placeholder="Type a message"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {openPanel === "voice" && (
        <div className="pointer-events-none absolute right-20 top-1/2 z-30 hidden w-[300px] -translate-y-1/2 lg:block">
          <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="mb-3 text-sm font-semibold">Voice Chat</div>
            <div className="mb-3 flex flex-wrap gap-2">
              {!inVoice ? (
                <button className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white" onClick={joinVoice}>
                  Join voice chat
                </button>
              ) : (
                <>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
                    onClick={toggleMute}
                  >
                    {muted ? "Unmute" : "Mute"}
                  </button>
                  <button className="rounded-lg bg-rose-600 px-3 py-2 text-xs text-white" onClick={leaveVoice}>
                    Exit
                  </button>
                </>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="mb-1 text-[11px] font-semibold text-slate-600">Participants</div>
              <div className="space-y-1 text-xs text-slate-700">
                {inVoice ? <div>{userName || "You"} {muted ? "(muted)" : "(speaking)"}</div> : null}
                {participants.map((item) => (
                  <div key={item.socketId}>
                    {item.userName || "Guest"} {item.muted ? "(muted)" : ""}
                  </div>
                ))}
                {!inVoice && !participants.length ? <div className="text-slate-500">Not connected</div> : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        {remoteStreams.map((item) => (
          <audio
            key={item.socketId}
            autoPlay
            playsInline
            ref={(node) => {
              if (node) {
                audioRefs.current[item.socketId] = node;
              }
            }}
          />
        ))}
      </div>
    </>
  );
}
