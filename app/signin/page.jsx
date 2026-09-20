import { signInAction } from "../actions/auth";
import Link from "next/link";
import { LuMail, LuLock } from "react-icons/lu";

export default function page() {
  return (
    <section
      className="flex-1 px-4 py-12 md:py-16"
      style={{ background: "linear-gradient(115deg, #f5f8fb 0%, #eff5f9 60%, #f5f8fb 100%)" }}
    >
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan mb-2">Welcome back</p>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-navy">Sign in</h2>
        <p className="mt-1.5 text-sm text-slate-gray">
          Sign in to keep your clubs, reading guides and prayer rhythm close.
        </p>

        <form className="mt-7 grid gap-4" action={signInAction}>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-gray">Email</span>
            <div className="relative">
              <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-navy outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                required
                type="email"
                name="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-slate-gray">Password</span>
            <div className="relative">
              <LuLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-navy outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
                required
                type="password"
                name="password"
              />
            </div>
          </label>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg py-3 font-bold text-sm bg-cyan text-navy transition hover:bg-cyan-dark"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-gray text-center">
          New to Relate?{" "}
          <Link href="/signup" className="font-semibold text-cyan-dark hover:text-navy transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
