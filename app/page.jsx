import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";

export const metadata = {
  title: "Relate — Grow in Every Area of Life",
  description:
    "Prayer times, Bible reading, community groups, skills training, and more. Download the Relate app for Android. iOS coming soon.",
};

export default function page() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Features />

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-8 text-center" style={{ background: "linear-gradient(135deg, #1d2a4d 0%, #13c5dd 100%)" }}>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
          Download Relate today
        </h2>
        <p className="text-sm sm:text-base text-white/70 mb-8 max-w-md mx-auto">
          Start growing in every area of your life. Available on Android now, iOS coming soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <a
            href="/relate.apk"
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#25D366" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
            </svg>
            <div className="text-left">
              <span className="block text-[10px] leading-none opacity-80">GET IT ON</span>
              <span className="block text-sm font-bold">Android</span>
            </div>
          </a>
          <div
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-semibold cursor-not-allowed opacity-60 text-white"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <svg width="20" height="24" viewBox="0 0 20 24" fill="white">
              <path d="M14.94 5.19A4.38 4.38 0 0012 3.5a4.4 4.4 0 00-3.15 1.32 4.17 4.17 0 00-1.2 3.09c0 1.2.5 2.3 1.33 3.08a4.27 4.27 0 003.15 1.35 4.34 4.34 0 003.18-1.38 4.19 4.19 0 001.21-3.09c0-1.2-.49-2.31-1.31-3.1l.03-.02v-.02zm-2.9 8.01a4.05 4.05 0 01-2.59-.98l-.12-.1a2.52 2.52 0 01-.07-3.52c.72-.71 1.77-1.09 2.85-1.09.33 0 .66.04.98.12l.17.04a2.35 2.35 0 011.46 2.19c0 .62-.26 1.21-.71 1.66-.47.45-1.09.7-1.75.7h-.22zm5.67 3.74c-.87.67-1.79 1.26-2.76 1.75-.97.49-1.97.75-3 .75s-2.03-.26-3-.75A12.18 12.18 0 013.43 16.9a11.45 11.45 0 01-2.27-3.45A10.4 10.4 0 010 11c0-1.72.6-3.41 1.16-5.09A12.28 12.28 0 014 2.46C5.96 1.47 7.96 1.2 10 1.2s4.04.27 6 1.26a12.28 12.28 0 012.84 3.45C19.4 7.59 20 9.28 20 11c0 1.23-.33 2.45-.69 3.2a11.45 11.45 0 01-2.27 3.45l.13.21z" />
            </svg>
            <div className="text-left">
              <span className="block text-[10px] leading-none opacity-80">DOWNLOAD ON THE</span>
              <span className="block text-sm font-bold">App Store</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/40">iOS coming soon</p>
      </section>
    </div>
  );
}
