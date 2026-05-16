import { PiHandsPraying } from "react-icons/pi";
import { HiOutlineHeart } from "react-icons/hi2";

export default function PrayerRequest() {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#1d2a4d" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div
            className="size-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: "#13c5dd", color: "white" }}
          >
            <PiHandsPraying />
          </div>
          <h2 className="text-4xl font-semibold text-white">
            Prayer Requests
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#13c5dd" }}>
            We believe in the power of prayer. Share your request with us, and our team will pray with you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl p-8"
            style={{ backgroundColor: "#eff5f9" }}
          >
            <form className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineHeart style={{ color: "#13c5dd" }} />
                <span className="text-sm font-medium" style={{ color: "#1d2a4d" }}>
                  Your request is confidential and will be treated with care.
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "white", color: "#1d2a4d" }}
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email (optional)"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "white", color: "#1d2a4d" }}
                />
              </div>
              <textarea
                rows={5}
                placeholder="Share your prayer request..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: "white", color: "#1d2a4d" }}
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
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
