import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import useAuthStore from "../store/authStore";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const signup = useAuthStore((state) => state.signup);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const loading = useAuthStore((state) => state.loading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signup({ name, email, password });
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
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight">Create your workspace and invite your team.</h2>
          <p className="mt-4 text-sm text-slate-300">
            JWT-secure collaboration, protected board routes, and real-time drawing in one place.
          </p>
        </aside>

        <div className="p-8 sm:p-10">
          <img src="/drawza-logo.svg" alt="Drawza logo" className="h-12 w-auto" />
          <h1 className="mt-3.5 font-display text-3xl font-bold leading-tight">Create your workspace</h1>
          <p className="mb-4 mt-2 text-sm text-slate-600">
            Set up your account and start drawing with your team in real time.
          </p>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="drawza-input"
              required
            />
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
              {loading ? "Creating..." : "Start with Drawza"}
            </button>
          </form>
          <div className="my-3 text-center text-xs text-slate-500">or</div>
          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />
          <p className="mt-3.5 text-sm text-slate-600">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
