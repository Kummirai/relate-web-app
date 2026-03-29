"use client";

import Link from "next/link";
import { IoBookOutline } from "react-icons/io5";
import { useVerse } from "@/context/VerseContext";

export default function VerseOfTheDay() {
  const { verse, loading, error, refetch } = useVerse();

  if (loading) return <p></p>;
  if (error)
    return (
      <p>
        {error} <button onClick={refetch}>Retry</button>
      </p>
    );

  const { reference, version, text } = verse?.verse.details;
  return (
    <>
      <section className=" text-sm pb-44 pt-20 h-[calc(100vh-76px)]">
        <div className="flex items-center gap-2 border border-slate-300 hover:border-slate-400/70 rounded-full w-max mx-auto px-7 py-2">
          <button className="hidden md:flex items-center gap-2.5 bg-linear-to-r from-zinc-950 to-zinc-500 text-zinc-50 hover:text-zinc-200 text-sm pl-5 pr-10 py-2 rounded-full cursor-pointer border-0">
            <span>Verse Of the Day</span>
          </button>
        </div>
        <h5 className="text-4xl md:text-6xl font-medium max-w-212.5 text-center mx-auto mt-8">
          {reference} {version}
        </h5>

        <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2">
          {text}.
        </p>

        <div className="mx-auto w-full flex items-center justify-center gap-3 mt-4">
          <button className="bg-zinc-950 to-zinc-500 text-zinc-50  px-7 py-3 rounded-full font-medium transition">
            <Link href={"#"}>Read Entire Chapter</Link>
          </button>

          <button className="flex items-center gap-2 border border-slate-300 hover:bg-slate-200/30 rounded-full px-6 py-3">
            <Link href={"/study"}>
              <span>View Bible Studies</span>
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
                stroke="#050040"
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
