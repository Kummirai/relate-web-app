"use client";

import { useState } from "react";
import { HiOutlineEnvelope, HiOutlineMapPin, HiOutlinePhone, HiOutlinePaperAirplane } from "react-icons/hi2";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mailtoLink = `mailto:ajaxmilton@hotmail.com?subject=Contact from ${encodeURIComponent(formData.name)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  return (
    <>
      <section className="py-20 md:py-28 px-4" style={{ backgroundColor: "#eff5f9" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-medium mb-6" style={{ color: "#1d2a4d" }}>
            Contact Us
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#1d2a4d" }}>
            We would love to hear from you. Whether you have a question, need prayer, or want to get involved — reach out.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-medium mb-8" style={{ color: "#1d2a4d" }}>
              Get in Touch
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}>
                  <HiOutlineEnvelope className="text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>Email</p>
                  <a href="mailto:ajaxmilton@hotmail.com" className="text-sm" style={{ color: "#13c5dd" }}>
                    ajaxmilton@hotmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}>
                  <HiOutlineMapPin className="text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>Location</p>
                  <p className="text-sm" style={{ color: "#1d2a4d" }}>Harare, Zimbabwe</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#eff5f9", color: "#13c5dd" }}>
                  <HiOutlinePhone className="text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1d2a4d" }}>Phone</p>
                  <p className="text-sm" style={{ color: "#1d2a4d" }}>Contact us via email for phone details</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-medium mb-8" style={{ color: "#1d2a4d" }}>
              Send a Message
            </h2>

            {submitted ? (
              <div className="rounded-lg p-8 text-center" style={{ backgroundColor: "#eff5f9" }}>
                <p className="text-base font-medium mb-2" style={{ color: "#1d2a4d" }}>
                  Thank you for reaching out!
                </p>
                <p className="text-sm" style={{ color: "#1d2a4d" }}>
                  Your message has been opened in your email client. We will get back to you as soon as we can.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#1d2a4d" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ backgroundColor: "#eff5f9", border: "1px solid #1d2a4d1a", color: "#1d2a4d" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#1d2a4d" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ backgroundColor: "#eff5f9", border: "1px solid #1d2a4d1a", color: "#1d2a4d" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#1d2a4d" }}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ backgroundColor: "#eff5f9", border: "1px solid #1d2a4d1a", color: "#1d2a4d" }}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 text-white text-sm px-6 py-3 rounded-lg transition-all hover:opacity-90 cursor-pointer border-0"
                  style={{ backgroundColor: "#13c5dd" }}
                >
                  <HiOutlinePaperAirplane className="text-base" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-4" style={{ backgroundColor: "#1d2a4d" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
            Prayer Requests
          </h2>
          <p className="text-sm mb-8" style={{ color: "#eff5f9" }}>
            If you have a prayer request, we would be honoured to pray with you. Send us an email or reach out through the form above.
          </p>
          <a
            href="mailto:ajaxmilton@hotmail.com"
            className="inline-flex items-center gap-2 text-white text-sm px-8 py-3.5 rounded-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "#13c5dd" }}
          >
            <HiOutlineEnvelope className="text-base" />
            Email Prayer Request
          </a>
        </div>
      </section>
    </>
  );
}
