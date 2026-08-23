import { signInAction } from "../actions/auth";
import Link from "next/link";

export default function page() {
  return (
    <section className="flex items-center justify-center px-4 py-12 md:py-20">
      <form
        className="w-full max-w-sm flex flex-col items-center bg-white p-8 sm:p-10 rounded-2xl shadow-sm"
        action={signInAction}
      >
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "#1d2a4d" }}>
          Sign in
        </h2>
        <p className="mt-2 text-sm text-center" style={{ color: "#6b7a8d" }}>
          Welcome back! Please sign in to continue.
        </p>

        {/* Email */}
        <div className="mt-8 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full pl-5" style={{ border: "1px solid #13c5dd" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#13c5dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
            <rect x="2" y="4" width="20" height="16" rx="2" />
          </svg>
          <input
            placeholder="Email"
            className="h-full w-full bg-transparent text-sm outline-none"
            style={{ color: "#1d2a4d" }}
            required
            type="email"
            name="email"
          />
        </div>

        {/* Password */}
        <div className="mt-4 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full pl-5" style={{ border: "1px solid #13c5dd" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#13c5dd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            placeholder="Password"
            className="h-full w-full bg-transparent text-sm outline-none"
            style={{ color: "#1d2a4d" }}
            required
            type="password"
            name="password"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-8 h-11 w-full cursor-pointer rounded-full text-white font-semibold text-sm transition hover:opacity-90"
          style={{ background: "#13c5dd" }}
        >
          Sign In
        </button>

        <p className="mt-5 text-sm" style={{ color: "#6b7a8d" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold" style={{ color: "#13c5dd" }}>
            Sign up
          </Link>
        </p>
      </form>
    </section>
  );
}
