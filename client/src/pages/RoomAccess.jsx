import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function normalizeRoomCode(value) {
  return value.trim().replace(/\s+/g, "");
}

export default function RoomAccess() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const personalRoomId = useMemo(() => {
    if (!user?._id) {
      return "personal-default";
    }
    return `personal-${user._id}`;
  }, [user]);

  const openPersonal = () => {
    navigate(`/board/${personalRoomId}`, { replace: true });
  };

  const createCollaborative = () => {
    const roomId = `room-${generateRoomCode()}`;
    navigate(`/board/${roomId}`);
  };

  const joinByCode = (e) => {
    e.preventDefault();
    setError("");
    const code = normalizeRoomCode(joinCode);
    if (!code) {
      setError("Enter a valid room code.");
      return;
    }
    navigate(`/board/${code}`);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="drawza-card w-full max-w-3xl rounded-2xl p-7">
        <div className="mb-6 flex items-center gap-3">
          <img src="/drawza-logo.svg" alt="Drawza logo" className="h-10 w-auto" />
          <div>
            <h1 className="font-display text-3xl font-bold">Choose Workspace</h1>
            <p className="text-sm text-slate-600">Start personal, create a collaborative room, or join with code.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm" onClick={openPersonal}>
            <p className="mb-1 text-sm font-semibold">Personal board</p>
            <p className="text-xs text-slate-500">Private workspace. You can still share its room code later.</p>
          </button>

          <button
            className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-left shadow-sm"
            onClick={createCollaborative}
          >
            <p className="mb-1 text-sm font-semibold text-blue-800">Create collaborative room</p>
            <p className="text-xs text-blue-700">Generates a new room code for team collaboration.</p>
          </button>
        </div>

        <form className="mt-5 rounded-xl border border-slate-200 bg-white p-4" onSubmit={joinByCode}>
          <p className="mb-2 text-sm font-semibold">Enter room code</p>
          <div className="flex gap-2">
            <input
              type="text"
              className="drawza-input !mb-0"
              placeholder="e.g. room-AB12CD34"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button type="submit" className="drawza-btn-primary !rounded-xl !px-5">
              Join
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
