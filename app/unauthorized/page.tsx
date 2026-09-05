import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <section className="min-h-[calc(100vh-92px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div
          className="mx-auto mb-6 flex items-center justify-center rounded-full text-4xl"
          style={{ background: "rgba(19,197,221,0.12)", color: "#13c5dd", width: 72, height: 72 }}
        >
          🔒
        </div>
        <h1 className="text-3xl font-medium text-gray-800 mb-2">Access restricted</h1>
        <p className="text-gray-500 text-sm mb-8">
          This area is for the Relate administration team. If you believe this is a
          mistake, please sign in with an admin account or contact support.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="text-sm font-medium px-6 py-2.5 rounded-full transition hover:opacity-90 text-white"
            style={{ background: "#13c5dd" }}
          >
            Back to home
          </Link>
          <Link
            href="/signin"
            className="text-sm font-medium px-6 py-2.5 rounded-full transition hover:opacity-80"
            style={{ color: "#13c5dd", background: "rgba(19,197,221,0.1)" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}