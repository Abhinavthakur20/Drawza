import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate("/rooms", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    try {
      await googleLogin(credential);
      navigate("/rooms", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="drawza-card grid w-full max-w-5xl overflow-hidden lg:grid-cols-2">
        <aside className="hidden bg-slate-900 p-10 text-white lg:block">
          <img src="/drawza-logo.svg" alt="Drawza logo" className="h-12 w-auto rounded-md bg-white px-2 py-1" />
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight">Work visually with your team in real time.</h2>
          <p className="mt-4 text-sm text-slate-300">
            Create secure whiteboard rooms, collaborate instantly, and keep every board persisted.
          </p>
        </aside>

        <div className="p-8 sm:p-10">
          <img src="/drawza-logo.svg" alt="Drawza logo" className="h-12 w-auto" />
          <h1 className="mt-3.5 font-display text-3xl font-bold leading-tight">Welcome back</h1>
          <p className="mb-4 mt-2 text-sm text-slate-600">
            Sign in to continue your collaborative whiteboard sessions.
          </p>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="drawza-input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="drawza-input"
              required
            />
            {error ? <div className="text-sm text-red-700">{error}</div> : null}
            <button type="submit" disabled={loading} className="drawza-btn-primary mt-1 !rounded-xl !py-3">
              {loading ? "Logging in..." : "Enter Drawza"}
            </button>
          </form>
          <div className="my-3 text-center text-xs text-slate-500">or</div>
          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />
          <p className="mt-3.5 text-sm text-slate-600">
            New to Drawza? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
