import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/home/Footer";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Relate",
  description:
    "Prayer times, Bible reading, community groups, skills training, and more. Download the Relate app.",
};

export default async function RootLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`} style={{ background: "#eff5f9" }}>
        {/* Header */}
        <header className="sticky top-0 z-50 px-4 sm:px-6 md:px-8 lg:px-20 py-4" style={{ background: "#eff5f9" }}>
          <nav className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="font-bold text-xl" style={{ color: "#1d2a4d" }}>
              Relate
            </Link>
            <div className="flex items-center gap-3">
              {session ? (
                <>
                  {session.user.role === "admin" && (
                    <>
                      <Link
                        href="/records"
                        className="text-sm font-medium px-4 py-2 rounded-full transition hover:opacity-80"
                        style={{ color: "#13c5dd", background: "rgba(19,197,221,0.1)" }}
                      >
                        Records
                      </Link>
                      <Link
                        href="/records/streaks"
                        className="text-sm font-medium px-4 py-2 rounded-full transition hover:opacity-80"
                        style={{ color: "#13c5dd", background: "rgba(19,197,221,0.1)" }}
                      >
                        Restore Streaks
                      </Link>
                    </>
                  )}
                  <Link
                    href="/admin/social-joins"
                    className="text-sm font-medium px-4 py-2 rounded-full transition hover:opacity-80"
                    style={{ color: "#13c5dd", background: "rgba(19,197,221,0.1)" }}
                  >
                    Admin
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signin" className="text-sm font-medium" style={{ color: "#1d2a4d" }}>
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm font-semibold px-5 py-2 rounded-full text-white transition hover:opacity-90"
                    style={{ background: "#13c5dd" }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
