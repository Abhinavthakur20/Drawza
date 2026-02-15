import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const BOARD_FEATURES = [
  "Infinite canvas feel with zoom and pan",
  "Element tools: select, rectangle, line, pencil",
  "Resize, move, and delete selected elements",
  "JWT auth for both REST and Socket.io",
];

const HIGHLIGHTED_FEATURES = [
  {
    title: "Real-time collaboration",
    text: "Work together on the same board with instant sync for every participant.",
    badge: "Live",
    tone: "bg-blue-50 text-blue-700",
    cardTone: "from-blue-50 to-cyan-50",
  },
  {
    title: "Voice chat realtime",
    text: "Discuss ideas while drawing so decisions happen faster in one session.",
    badge: "Voice",
    tone: "bg-violet-50 text-violet-700",
    cardTone: "from-violet-50 to-fuchsia-50",
  },
  {
    title: "Simple chat",
    text: "Use lightweight room chat for quick notes, links, and team coordination.",
    badge: "Chat",
    tone: "bg-emerald-50 text-emerald-700",
    cardTone: "from-emerald-50 to-teal-50",
  },
  {
    title: "Secure room access",
    text: "JWT protected room sessions keep collaboration private and controlled.",
    badge: "Security",
    tone: "bg-amber-50 text-amber-700",
    cardTone: "from-amber-50 to-orange-50",
  },
];

export default function Home() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <main className="min-h-screen bg-sky-50/40 text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <header className="mb-12 flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <img src="/drawza-logo.svg" alt="Drawza logo" className="h-16 w-auto animate-float-soft sm:h-20" />
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {!token ? (
              <>
                <Link className="drawza-btn-secondary" to="/login">
                  Log in
                </Link>
                <Link className="drawza-btn-primary" to="/signup">
                  Get started
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user?.name || "User"} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {(user?.name || "U").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate">{user?.name || "Profile"}</span>
                </Link>
                <Link className="drawza-btn-primary" to="/rooms">
                  Open board
                </Link>
                <button className="drawza-btn-secondary" onClick={logout}>
                  Logout
                </button>
              </>
            )}
          </nav>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
            <p className="mb-3 inline-flex rounded-full bg-pink-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-pink-700">
              For modern teams
            </p>
            <h1 className="max-w-xl font-display text-5xl font-bold leading-tight sm:text-6xl">
              Simplify visual collaboration with Drawza
            </h1>
            <p className="mt-5 max-w-lg text-base text-slate-600">
              Secure, real-time whiteboarding with JWT authentication, protected rooms, and a fast element-based
              canvas engine.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link className="drawza-btn-primary !px-6 !py-3" to={token ? "/rooms" : "/signup"}>
                Start free
              </Link>
              <Link className="drawza-btn-secondary !px-6 !py-3" to="/login">
                Sign in
              </Link>
              <span className="text-sm text-slate-500">Trusted by product, design, and engineering teams</span>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "160ms" }}>
            <div className="absolute -left-8 top-16 h-24 w-24 rounded-full bg-orange-200/90 animate-float-soft" />
            <div className="absolute -bottom-6 right-2 h-24 w-24 rounded-full bg-green-200/90 animate-float-soft" style={{ animationDelay: "600ms" }} />
            <div className="drawza-card drawza-hover-card relative overflow-hidden bg-gradient-to-br from-white via-sky-50/50 to-violet-50/40 p-4">
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-100 p-3">
                <p className="text-sm font-semibold">Team chat</p>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700">Today</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">Could we review the new flow?</div>
                <div className="ml-auto w-4/5 rounded-2xl bg-blue-500 p-3 text-sm text-white">
                  Added to board: brainstorm + user journey map.
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">
                  Looks great. Let us finalize this in Drawza.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 border-y border-slate-200 py-7 text-center text-sm font-semibold text-slate-500 sm:grid-cols-5">
          <span>Bukalapak</span>
          <span>Google</span>
          <span>Amazon</span>
          <span>Shopify</span>
          <span>Gojek</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 animate-fade-up">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Main highlighted features</h2>
          <span className="drawza-pill">Core value</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {HIGHLIGHTED_FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className={`drawza-card drawza-hover-card animate-fade-up rounded-2xl ${
                index === 1 ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" : `bg-gradient-to-br ${feature.cardTone}`
              } p-5`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{feature.title}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${feature.tone}`}>{feature.badge}</span>
              </div>
              <p className={`text-sm ${index === 1 ? "text-slate-200" : "text-slate-600"}`}>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight animate-fade-up">Whiteboard to streamline your workflow</h2>
          <p className="mt-5 text-slate-600">
            Build brainstorms, product flows, and planning boards with responsive interactions built for collaboration.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {BOARD_FEATURES.map((item, index) => (
              <li key={item} className="animate-fade-up flex items-start gap-2" style={{ animationDelay: `${index * 90}ms` }}>
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="drawza-card drawza-hover-card relative animate-fade-up bg-slate-900 p-6 text-white" style={{ animationDelay: "120ms" }}>
          <div className="mb-4 flex items-center justify-between text-xs text-slate-300">
            <span>Brainstorm board</span>
            <span className="rounded-full bg-blue-500/30 px-2 py-1 text-blue-200">Live</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`h-16 rounded-lg ${i % 3 === 0 ? "bg-yellow-300" : i % 3 === 1 ? "bg-blue-300" : "bg-green-300"}`}
              />
            ))}
          </div>
          <div className="absolute -bottom-6 right-8 h-14 w-14 rounded-b-full rounded-t-3xl bg-indigo-400/70" />
        </div>
      </section>

      <section className="bg-gradient-to-b from-indigo-50/40 to-rose-50/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-4xl font-bold animate-fade-up">Features on whiteboard</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="drawza-card drawza-hover-card animate-fade-up rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-5">
              <h3 className="font-semibold">Structured brainstorm</h3>
              <p className="mt-2 text-sm text-slate-600">Collect ideas rapidly and convert them into execution plans.</p>
            </article>
            <article className="drawza-card drawza-hover-card animate-fade-up rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 p-5" style={{ animationDelay: "90ms" }}>
              <h3 className="font-semibold">Collaboration done right</h3>
              <p className="mt-2 text-sm text-slate-600">Realtime sockets keep every participant synchronized.</p>
            </article>
            <article className="drawza-card drawza-hover-card animate-fade-up rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5" style={{ animationDelay: "180ms" }}>
              <h3 className="font-semibold">Actionable sessions</h3>
              <p className="mt-2 text-sm text-slate-600">Keep outcomes persistent and secure with JWT-protected APIs.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="animate-gradient-shift bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Build with Drawza today</h2>
            <p className="mt-2 text-sm text-slate-300">Spin up your first collaborative room in under a minute.</p>
          </div>
          <Link className="drawza-btn-primary !bg-white !text-slate-900 hover:!bg-slate-200 !px-6 !py-3" to={token ? "/rooms" : "/signup"}>
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
