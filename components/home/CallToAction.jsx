import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="py-16 px-4" style={{ background: "linear-gradient(120deg, #eff5f9 0%, white 40%, #f0f6fa 100%)" }}>
        <div className="max-w-5xl mx-auto rounded-lg px-8 py-12 md:py-20" style={{ background: "linear-gradient(135deg, white 0%, #f0f6fa 100%)", boxShadow: "0 4px 40px rgba(19, 197, 221, 0.08)" }}>
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl/14 leading-tight font-medium tracking-tighter max-w-xl mx-auto mb-4" style={{ color: "#1d2a4d" }}>
              Every Skill
              <span className="ml-2 bg-linear-to-r from-[#13c5dd] to-[#1d2a4d] bg-clip-text text-transparent">
                Strengthens Our Community
              </span>
            </h1>
            <p className="text-sm max-w-md mx-auto mb-8" style={{ color: "#1d2a4d" }}>
              Share what you know or learn something new. Our skills exchange
              connects people who want to teach with those who want to learn.
            </p>
            <Link
              href="/skills"
              className="text-white text-sm px-6 py-3 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer group"
              style={{ backgroundColor: "#13c5dd" }}
            >
              <div className="relative overflow-hidden">
                <span className="block transition-transform duration-200 group-hover:-translate-y-full">
                  Join Skills Exchange
                </span>
                <span className="absolute top-0 left-0 block transition-transform duration-200 group-hover:translate-y-0 translate-y-full">
                  Join Skills Exchange
                </span>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m5.833 14.168 8.334-8.333m0 8.333V5.835H5.833"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
    </section>
  );
}
