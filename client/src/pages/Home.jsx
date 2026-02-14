import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

const CORE_FEATURES = [
  { title: "Unlimited Boards", text: "Create as many collaborative rooms as your team needs." },
  { title: "Live Presence", text: "See who is online and follow cursor movement in real time." },
  { title: "Session Recording", text: "Board state is persisted in MongoDB for every room." },
  { title: "Voice Notes", text: "Use notes and quick annotations to accelerate feedback loops." },
  { title: "Cloud Sync", text: "JWT protected APIs with room-based synchronization." },
  { title: "Version Safety", text: "Undo/redo history with element-based rendering model." },
];

const BOARD_FEATURES = [
  "Infinite canvas feel with zoom and pan",
  "Element tools: select, rectangle, line, pencil",
  "Resize, move, and delete selected elements",
  "JWT auth for both REST and Socket.io",
];

export default function Home() {
  const token = useAuthStore((state) => state.token);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/drawza-logo.svg" alt="Drawza logo" className="h-12 w-auto" />
            <div>
              <p className="font-display text-xl">Drawza</p>
              <p className="text-xs text-slate-500">Collaborative whiteboard workspace</p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link className="drawza-btn-secondary" to="/login">
              Log in
            </Link>
            <Link className="drawza-btn-primary" to={token ? "/rooms" : "/signup"}>
              {token ? "Open board" : "Get started"}
            </Link>
          </nav>
        </header>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-red-500">For modern teams</p>
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

          <div className="relative">
            <div className="absolute -left-8 top-16 h-24 w-24 rounded-full bg-orange-400/90" />
            <div className="absolute -bottom-6 right-2 h-24 w-24 rounded-full bg-green-300/90" />
            <div className="drawza-card relative overflow-hidden p-4">
              <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-100 p-3">
                <p className="text-sm font-semibold">Team chat</p>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700">Today</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-600">Could we review the new flow?</div>
                <div className="ml-auto w-4/5 rounded-2xl bg-blue-600 p-3 text-sm text-white">
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

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CORE_FEATURES.map((item) => (
              <article key={item.title} className="drawza-card rounded-2xl p-5">
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">Whiteboard to streamline your workflow</h2>
          <p className="mt-5 text-slate-600">
            Build brainstorms, product flows, and planning boards with responsive interactions built for collaboration.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {BOARD_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="drawza-card relative p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>Brainstorm board</span>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">Live</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`h-16 rounded-lg ${i % 3 === 0 ? "bg-yellow-200" : i % 3 === 1 ? "bg-blue-200" : "bg-green-200"}`}
              />
            ))}
          </div>
          <div className="absolute -bottom-6 right-8 h-14 w-14 rounded-b-full rounded-t-3xl bg-purple-400/80" />
        </div>
      </section>

      <section className="bg-slate-100 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-4xl font-bold">Features on whiteboard</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="drawza-card rounded-2xl p-5">
              <h3 className="font-semibold">Structured brainstorm</h3>
              <p className="mt-2 text-sm text-slate-600">Collect ideas rapidly and convert them into execution plans.</p>
            </article>
            <article className="drawza-card rounded-2xl p-5">
              <h3 className="font-semibold">Collaboration done right</h3>
              <p className="mt-2 text-sm text-slate-600">Realtime sockets keep every participant synchronized.</p>
            </article>
            <article className="drawza-card rounded-2xl p-5">
              <h3 className="font-semibold">Actionable sessions</h3>
              <p className="mt-2 text-sm text-slate-600">Keep outcomes persistent and secure with JWT-protected APIs.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-bold">Build with Drawza today</h2>
            <p className="mt-2 text-sm text-slate-300">Spin up your first collaborative room in under a minute.</p>
          </div>
          <Link className="drawza-btn-primary !bg-blue-500 !px-6 !py-3" to={token ? "/rooms" : "/signup"}>
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
