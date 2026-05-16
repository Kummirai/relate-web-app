import { PiHandsPraying } from "react-icons/pi";
import { HiOutlineHeart } from "react-icons/hi2";

export default function PrayerRequest() {
  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden" style={{ backgroundColor: "#1d2a4d" }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ background: "radial-gradient(circle at 50% 0%, #13c5dd 0%, transparent 50%)" }} />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div
            className="size-16 rounded-lg flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: "#13c5dd", color: "white" }}
          >
            <PiHandsPraying />
          </div>
          <h2 className="text-4xl font-medium text-white">
            Prayer Requests
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#13c5dd" }}>
            We believe in the power of prayer. Share your request with us, and our team will pray with you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-lg p-6 md:p-8"
            style={{ backgroundColor: "#eff5f9" }}
          >
            <form className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineHeart style={{ color: "#13c5dd" }} />
                <span className="text-sm" style={{ color: "#1d2a4d" }}>
                  Your request is confidential and will be treated with care.
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "white", color: "#1d2a4d" }}
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email (optional)"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "white", color: "#1d2a4d" }}
                />
              </div>
              <textarea
                rows={5}
                placeholder="Share your prayer request..."
                className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                style={{ backgroundColor: "white", color: "#1d2a4d" }}
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#13c5dd" }}
              >
                Submit Prayer Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
