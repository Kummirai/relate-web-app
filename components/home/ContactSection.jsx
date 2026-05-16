import { HiOutlineEnvelope, HiOutlineMapPin, HiOutlinePhone } from "react-icons/hi2";

export default function ContactSection() {
  return (
    <section className="py-16 md:py-20 px-4" style={{ background: "linear-gradient(180deg, #eff5f9 0%, white 50%, #eff5f9 100%)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-medium" style={{ color: "#1d2a4d" }}>
            Get In Touch
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Have questions or want to get involved? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-start">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div
                className="size-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: "#13c5dd", color: "white" }}
              >
                <HiOutlineMapPin />
              </div>
              <div>
                <h3 className="text-lg font-medium" style={{ color: "#1d2a4d" }}>Our Location</h3>
                <p className="text-sm mt-1" style={{ color: "#1d2a4d" }}>
                  Serving communities across the region with faith-rooted love and support.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div
                className="size-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: "#13c5dd", color: "white" }}
              >
                <HiOutlineEnvelope />
              </div>
              <div>
                <h3 className="text-lg font-medium" style={{ color: "#1d2a4d" }}>Email Us</h3>
                <p className="text-sm mt-1" style={{ color: "#1d2a4d" }}>
                  ajaxmilton@hotmail.com
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div
                className="size-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: "#13c5dd", color: "white" }}
              >
                <HiOutlinePhone />
              </div>
              <div>
                <h3 className="text-lg font-medium" style={{ color: "#1d2a4d" }}>Prayer & Support</h3>
                <p className="text-sm mt-1" style={{ color: "#1d2a4d" }}>
                  Reach out for prayer requests, mentorship, or community assistance.
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-6 md:p-8"
            style={{ backgroundColor: "white" }}
          >
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ backgroundColor: "#eff5f9", color: "#1d2a4d" }}
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{ backgroundColor: "#eff5f9", color: "#1d2a4d" }}
                  required
                />
              </div>
              <div>
                <textarea
                  rows={4}
                  placeholder="Your Message"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none transition-all"
                  style={{ backgroundColor: "#eff5f9", color: "#1d2a4d" }}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg text-sm text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#13c5dd" }}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
