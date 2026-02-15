import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../utils/api";

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get("/api/auth/me");
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setAvatarUrl(data.user.avatarUrl || "");
        }
      } catch (_) {
        logout();
        navigate("/login", { replace: true });
      }
    };

    loadProfile();
  }, [navigate, setUser, logout]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.put("/api/auth/me", { name, avatarUrl });
      if (data?.user) {
        setUser(data.user);
      }
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="drawza-card w-full max-w-2xl rounded-2xl p-7">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">User Profile</h1>
            <p className="text-sm text-slate-600">Manage your account details used in collaborative rooms.</p>
          </div>
          <Link to="/rooms" className="drawza-btn-secondary !rounded-xl !px-4 !py-2">
            Back
          </Link>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
            <input className="drawza-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input className="drawza-input bg-slate-100" value={user?.email || ""} disabled />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-slate-700">Avatar URL</label>
            <input
              className="drawza-input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name || "User avatar"} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-semibold text-slate-600">
                  {(name || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Member since{" "}
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
            </div>
          </div>

          {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="mb-3 text-sm text-emerald-700">{message}</p> : null}

          <button type="submit" disabled={loading} className="drawza-btn-primary !rounded-xl !px-5 !py-2.5 disabled:opacity-60">
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
