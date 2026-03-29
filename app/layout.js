import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "@/components/home/Footer";
import { VerseProvider } from "@/context/VerseContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Relate",
  description: "Family Care Record Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-[url('https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gridBackground.png')] w-full bg-repeat bg-top bg-contain `}
      >
        <VerseProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </VerseProvider>
      </body>
    </html>
  );
}
