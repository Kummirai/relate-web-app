"use client";

import Link from "next/link";
import { IoBookOutline } from "react-icons/io5";
import { useVerse } from "@/context/VerseContext";

export default function Hero() {
  const { verse } = useVerse();

  const placeholderVerse = {
    verse: {
      details: {
        text: "Praise be to the God and Father of our Lord Jesus Christ! In his great mercy he has given us new birth into a living hope through the resurrection of Jesus Christ from the dead",
        reference: "1 Peter 1:3",
        version: "NIV",
        verseurl: "http://www.ourmanna.com/",
      },
      notice: "Powered by OurManna.com",
    },
  };

  const { reference, version } =
    verse?.verse.details || placeholderVerse.verse.details;

  return (
    <>
      <section className=" text-sm pb-44 pt-20 h-[calc(100vh-76px)]">
        <div className="flex items-center gap-2 border border-[#13c5dd] hover:border-[#13c5dd]/70 rounded-full w-max mx-auto px-4 py-2">
          <span>Verse of the Day</span>
          <Link
            href={"/verse"}
            className="hidden md:flex items-center gap-2.5 bg-[#1d2a4d] text-white hover:text-white/80 text-sm font-medium pl-5 pr-2 py-2 rounded-full cursor-pointer border-0"
          >
            <span className="mr-1">{reference}</span>
            <span>{version}</span>

            <span className="size-7 rounded-full bg-white flex items-center justify-center">
              <IoBookOutline className="text-[#1d2a4d]" />
            </span>
          </Link>
        </div>
        <h5 className="text-4xl md:text-6xl font-medium max-w-212.5 text-center mx-auto mt-8" style={{ color: "#1d2a4d" }}>
          Growing Together Through Shared Skills
        </h5>

        <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2" style={{ color: "#1d2a4d" }}>
          We believe we are stronger together. Share your skills, learn from
            others, and help our community grow through knowledge and connection.
        </p>

        <div className="mx-auto w-full flex items-center justify-center gap-3 mt-4">
          <button className="bg-[#13c5dd] text-white px-7 py-3 rounded-full font-medium transition hover:opacity-90">
            <Link href={"/skills"}>Explore Skills Exchange</Link>
          </button>

          <button className="flex items-center gap-2 border border-[#13c5dd] hover:bg-[#13c5dd]/10 rounded-full px-6 py-3">
            <Link href={"#"}>
              <span style={{ color: "#1d2a4d" }}>Request A Bible Study</span>
            </Link>
            <svg
              width="6"
              height="8"
              viewBox="0 0 6 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.25.5 4.75 4l-3.5 3.5"
                stroke="#1d2a4d"
                strokeOpacity=".4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>
    </>
  );
}
