export default function WhatWeDo() {
  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(225deg, #eff5f9 0%, white 50%, #f0f6fa 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: "#13c5dd" }} />
        </div>
        <h2 className="text-4xl font-medium text-center mb-14" style={{ color: "#1d2a4d" }}>
          What We Do
        </h2>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="relative shrink-0 w-full max-w-md">
            <div className="absolute -top-4 -left-4 w-full h-full rounded-lg" style={{ backgroundColor: "#13c5dd" }} />
            <div className="relative rounded-lg overflow-hidden">
              <img
                className="w-full aspect-[4/5] object-cover"
                src="https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?q=80&w=451&h=564&auto=format&fit=crop"
                alt=""
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1d2a4d] to-transparent h-32" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg">
                <div className="flex -space-x-3 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200"
                    alt=""
                    className="size-10 rounded-full border-[3px] border-white"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"
                    alt=""
                    className="size-10 rounded-full border-[3px] border-white"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop"
                    alt=""
                    className="size-10 rounded-full border-[3px] border-white"
                  />
                  <div className="flex items-center justify-center text-xs text-white size-10 rounded-full border-[3px] border-white" style={{ backgroundColor: "#13c5dd" }}>
                    50+
                  </div>
                </div>
                <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>
                  Community members strong
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-lg" style={{ color: "#1d2a4d" }}>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="size-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: "#13c5dd" }} />
                <div>
                  <h3 className="text-lg font-medium">Walk Alongside</h3>
                  <p className="text-sm leading-relaxed mt-1">
                    We walk with individuals and families through life's most difficult seasons —
                    praying with them, mentoring them, and connecting them to the support they need to rise.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: "#13c5dd" }} />
                <div>
                  <h3 className="text-lg font-medium">Identify & Support</h3>
                  <p className="text-sm leading-relaxed mt-1">
                    We identify those who are struggling and come alongside them with compassion and purpose.
                    Through one-on-one mentoring and home visits, we address the deeper journey toward wholeness.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: "#13c5dd" }} />
                <div>
                  <h3 className="text-lg font-medium">Pray & Grow Together</h3>
                  <p className="text-sm leading-relaxed mt-1">
                    We pray together, plan together, and walk together — because lasting change happens
                    in the context of genuine, Spirit-led relationship.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-2.5 text-white text-sm font-medium px-6 py-3 rounded-full mt-8 hover:opacity-90 transition"
              style={{ backgroundColor: "#13c5dd" }}
            >
              <span>Learn more about our work</span>
              <svg
                width="13"
                height="12"
                viewBox="0 0 13 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.53 6.53a.75.75 0 0 0 0-1.06L7.757.697a.75.75 0 1 0-1.06 1.06L10.939 6l-4.242 4.243a.75.75 0 0 0 1.06 1.06zM0 6v.75h12v-1.5H0z"
                  fill="#fff"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
