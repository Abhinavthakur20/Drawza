import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { DEMO_ACCOUNT } from "../constants/demoAccount";
import useAuthStore from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usingDemo, setUsingDemo] = useState(false);
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

  const handleDemoLogin = async () => {
    setError("");
    setUsingDemo(true);
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);

    try {
      await login(DEMO_ACCOUNT);
      navigate("/rooms", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setUsingDemo(false);
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
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Recruiter demo account</p>
                <p className="mt-1 text-xs text-slate-600">Use these credentials to view the project without signup.</p>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="drawza-btn-secondary !rounded-xl !border-blue-200 !px-4 !py-2 text-xs"
              >
                {usingDemo ? "Opening..." : "Use demo"}
              </button>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
              <p>
                Email: <span className="font-semibold text-slate-900">{DEMO_ACCOUNT.email}</span>
              </p>
              <p>
                Password: <span className="font-semibold text-slate-900">{DEMO_ACCOUNT.password}</span>
              </p>
            </div>
          </div>
          <p className="mt-3.5 text-sm text-slate-600">
            New to Drawza? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
