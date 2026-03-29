import Link from "next/link";

export default function Hero() {
  return (
    <>
      <section className=" text-sm pb-44 pt-20 h-[calc(100vh-76px)]">
        <div className="flex items-center gap-2 border border-slate-300 hover:border-slate-400/70 rounded-full w-max mx-auto px-4 py-2">
          <span>New announcement on your inbox</span>
          <button className="flex items-center gap-1 font-medium">
            <span>Read more</span>
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.959 9.5h11.083m0 0L9.501 3.958M15.042 9.5l-5.541 5.54"
                stroke="#050040"
                strokeWidth="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <h5 className="text-4xl md:text-7xl font-medium max-w-212.5 text-center mx-auto mt-8">
          Build apps faster with ui components
        </h5>

        <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2">
          Build sleek, consistent UIs without wrestling with design systems, our
          components handle the heavy lifting so you can ship faster.
        </p>

        <div className="mx-auto w-full flex items-center justify-center gap-3 mt-4">
          <button className="bg-zinc-950 to-zinc-500 text-zinc-50  px-7 py-3 rounded-full font-medium transition">
            <Link href={"/request"}>Submit A Prayer Request</Link>
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
                stroke-opacity=".4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </section>
    </>
  );
}
