import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "@/components/home/Footer";
import { VerseProvider } from "@/context/VerseContext";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Relate",
  description: "Family Care Record Management System",
};

export default async function RootLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-gradient-to-b from-[#eff5f9] via-white to-[#eff5f9]`}
      >
        <VerseProvider>
          <Navbar session={session} />
          <main>{children}</main>
          <Footer />
        </VerseProvider>
      </body>
    </html>
  );
}
