import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Canvas from "../components/Canvas";
import CollabHub from "../components/CollabHub";
import Toolbar from "../components/Toolbar";
import useAuthStore from "../store/authStore";
import useWhiteboardStore from "../store/whiteboardStore";
import api from "../utils/api";
import { createSocket } from "../utils/socket";

export default function Whiteboard() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const {
    elements,
    selectedIds,
    tool,
    zoom,
    panOffset,
    strokeColor,
    fillColor,
    strokeWidth,
    opacity,
    cursors,
    setElements,
    createElement,
    addRemoteElement,
    updateElement,
    patchElement,
    deleteElement,
    removeRemoteElement,
    clearElements,
    clearRemoteElements,
    setSelectedIds,
    setTool,
    setZoom,
    setPanOffset,
    setStrokeColor,
    setFillColor,
    setStrokeWidth,
    setOpacity,
    setCursor,
    undo,
    redo,
  } = useWhiteboardStore();

  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [socketClient, setSocketClient] = useState(null);
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    document.title = `Drawza - ${roomId}`;
  }, [roomId]);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const loadBoard = async () => {
      const { data } = await api.get(`/api/boards/${roomId}`);
      setElements(data.elements || []);
    };

    loadBoard().catch(() => {
      logout();
      navigate("/login", { replace: true });
    });
  }, [roomId, token, setElements, navigate, logout]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const socket = createSocket(token);
    socketRef.current = socket;
    setSocketClient(socket);

    socket.on("connect", () => {
      socket.emit("join-room", { roomId, userName: user?.name || "Guest" });
    });

    socket.on("element-create", (element) => {
      addRemoteElement(element);
    });

    socket.on("element-update", (element) => {
      patchElement(element);
    });

    socket.on("element-delete", ({ elementId }) => {
      removeRemoteElement(elementId);
    });

    socket.on("element-clear", () => {
      clearRemoteElements();
    });

    socket.on("cursor-move", ({ userId, cursor }) => {
      setCursor(userId, cursor);
    });

    socket.on("room-users", ({ count }) => {
      setOnlineCount(count || 1);
    });

    socket.on("connect_error", () => {
      logout();
      navigate("/login", { replace: true });
    });

    return () => {
      socket.disconnect();
      setSocketClient(null);
    };
  }, [
    roomId,
    token,
    user?.name,
    createElement,
    addRemoteElement,
    patchElement,
    deleteElement,
    removeRemoteElement,
    clearRemoteElements,
    setCursor,
    logout,
    navigate,
  ]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      api.post(`/api/boards/${roomId}`, { elements }).catch(() => {});
    }, 900);

    return () => clearTimeout(saveTimerRef.current);
  }, [elements, roomId]);

  const handlers = useMemo(
    () => ({
      onCreate: (element) => {
        createElement(element);
        socketRef.current?.emit("element-create", { roomId, element });
      },
      onUpdate: (element, localOnly = false) => {
        if (localOnly) {
          patchElement(element);
        } else {
          updateElement(element);
        }
        socketRef.current?.emit("element-update", { roomId, element });
      },
      onDelete: (elementId) => {
        deleteElement(elementId);
        socketRef.current?.emit("element-delete", { roomId, elementId });
      },
      onClear: () => {
        clearElements();
        socketRef.current?.emit("element-clear", { roomId });
      },
      onCursorMove: (cursor) => {
        socketRef.current?.emit("cursor-move", { roomId, cursor });
      },
    }),
    [roomId, createElement, updateElement, patchElement, deleteElement, clearElements]
  );

  const selectedElement = useMemo(
    () => elements.find((el) => selectedIds.includes(el.id)) || null,
    [elements, selectedIds]
  );

  const handleStyleChange = (stylePatch) => {
    if (!selectedElement) {
      return;
    }
    handlers.onUpdate({ ...selectedElement, ...stylePatch });
  };

  const handleDeleteSelected = () => {
    if (!selectedElement) {
      return;
    }
    handlers.onDelete(selectedElement.id);
  };

  const handleDuplicateSelected = () => {
    if (!selectedElement) {
      return;
    }

    const duplicated = {
      ...selectedElement,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x: selectedElement.x + 24,
      y: selectedElement.y + 24,
      points:
        selectedElement.type === "pencil"
          ? (selectedElement.points || []).map((p) => ({ x: p.x + 24, y: p.y + 24 }))
          : selectedElement.points || [],
      createdAt: new Date().toISOString(),
      createdBy: user?._id,
    };

    handlers.onCreate(duplicated);
    setSelectedIds([duplicated.id]);
  };

  useEffect(() => {
    if (!selectedElement) {
      return;
    }

    setStrokeColor(selectedElement.strokeColor || "#111111");
    setFillColor(selectedElement.fillColor || "transparent");
    setStrokeWidth(selectedElement.strokeWidth || 2);
    setOpacity(selectedElement.opacity ?? 100);
  }, [selectedElement, setStrokeColor, setFillColor, setStrokeWidth, setOpacity]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if (e.key === "Delete" && selectedIds.length) {
        handlers.onDelete(selectedIds[0]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers, selectedIds, undo, redo]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleShareRoomCode = async () => {
    const shareText = `Room code: ${roomId}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomId);
        window.alert(`${shareText} copied to clipboard.`);
        return;
      }
    } catch (_) {}

    window.prompt("Copy this room code", roomId);
  };

  const handleClearAll = () => {
    if (!elements.length) {
      return;
    }
    const confirmed = window.confirm("Clear all drawings from this board?");
    if (!confirmed) {
      return;
    }
    handlers.onClear();
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[#f7f7f8]">
      <Canvas
        elements={elements}
        selectedIds={selectedIds}
        tool={tool}
        zoom={zoom}
        panOffset={panOffset}
        strokeColor={strokeColor}
        fillColor={fillColor}
        strokeWidth={strokeWidth}
        opacity={opacity}
        cursors={cursors}
        userId={user?._id}
        setPanOffset={setPanOffset}
        setSelectedIds={setSelectedIds}
        setZoom={setZoom}
        onCreate={handlers.onCreate}
        onUpdate={handlers.onUpdate}
        onCursorMove={handlers.onCursorMove}
      />

      <Toolbar
        roomId={roomId}
        userName={user?.name}
        userAvatar={user?.avatar || user?.avatarUrl}
        tool={tool}
        setTool={setTool}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        opacity={opacity}
        setOpacity={setOpacity}
        selectedElement={selectedElement}
        onStyleChange={handleStyleChange}
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
        zoom={zoom}
        setZoom={setZoom}
        setPanOffset={setPanOffset}
        onUndo={undo}
        onRedo={redo}
        onClearAll={handleClearAll}
        hasElements={elements.length > 0}
        onlineCount={onlineCount}
        onShareRoomCode={handleShareRoomCode}
        onLogout={handleLogout}
      />

      <CollabHub socket={socketClient} roomId={roomId} userName={user?.name || "You"} />
    </div>
  );
}
