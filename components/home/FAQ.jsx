"use client";

import { useState } from "react";
import { HiOutlineChevronDown } from "react-icons/hi2";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi2";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How can I join the Relate community?",
      a: "Simply reach out through our contact form or attend one of our upcoming events. We welcome everyone with open arms.",
    },
    {
      q: "Do I need to be a member of a church to participate?",
      a: "Not at all. Everyone is welcome regardless of background or church affiliation. Our community is built on love and mutual respect.",
    },
    {
      q: "How does the Skills Exchange work?",
      a: "You can sign up to teach a skill or request to learn one. We match people based on their interests and availability.",
    },
    {
      q: "Can I request prayer or counseling?",
      a: "Yes. You can submit a prayer request or reach out to us directly. Our team is committed to walking with you through every season.",
    },
    {
      q: "How can I volunteer?",
      a: "Fill out our volunteer interest form and we will connect you with opportunities that match your gifts and availability.",
    },
    {
      q: "Is there a cost to participate?",
      a: "No. All our programs, events, and services are free. We believe community support should be accessible to everyone.",
    },
  ];

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "white" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-semibold" style={{ color: "#1d2a4d" }}>
            Frequently Asked Questions
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto mt-4" style={{ color: "#1d2a4d" }}>
            Quick answers to common questions about our community and programs.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{ backgroundColor: "#eff5f9" }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="flex items-center gap-3 text-sm font-medium" style={{ color: "#1d2a4d" }}>
                  <HiOutlineQuestionMarkCircle className="text-lg shrink-0" style={{ color: "#13c5dd" }} />
                  {faq.q}
                </span>
                <HiOutlineChevronDown
                  className={`text-lg shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`}
                  style={{ color: "#13c5dd" }}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-60" : "max-h-0"}`}
              >
                <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "#1d2a4d" }}>
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
