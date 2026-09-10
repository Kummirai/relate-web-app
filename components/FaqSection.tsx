"use client"

import {useState} from "react"
import Link from "next/link"
import {LuChevronDown, LuArrowRight} from "react-icons/lu"

const faqs = [
    {
        q: "Is Relate really free?",
        a: "Yes. Every magazine, seasonal study guide, prayer time and club chat is free for every family — no subscriptions, no in-app fees."
    },
    {
        q: "How does the daily reading work?",
        a: "Each club gets a seasonal study guide built from a calendar of 91 days. Every day opens with a verse, a short read, a reflection, and a prayer."
    },
    {
        q: "Which club should my family join?",
        a: "Pick the stage that fits: Sprout for little ones, Surge for youth, Pulse for young adults, Prime and Anchor for adults and families, and more."
    },
    {
        q: "Can I use Relate offline?",
        a: "Yes. Download a season's guide and your club's magazines, and everything reads offline — perfect for trips and busy days."
    },
]

export default function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-3xl mx-auto"}>
                <div className={"text-center mb-12"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>FAQ</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Frequently Asked <span className={"text-green-600"}>Questions</span>
                    </h2>
                </div>
                <div className={"space-y-3 mb-8"}>
                    {faqs.map((faq, i) => (
                        <div key={i} className={"bg-gray-50 rounded-xl overflow-hidden"}>
                            <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className={"w-full flex items-center justify-between p-5 text-left hover:bg-gray-100 transition-colors"}>
                                <span className={"font-medium text-gray-800 text-sm md:text-base pr-4"}>{faq.q}</span>
                                <LuChevronDown
                                    className={`text-lg text-gray-400 shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`}/>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-60" : "max-h-0"}`}>
                                <div className={"px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-4"}>
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={"text-center"}>
                    <Link href={"https://wa.me/27782677436?text=Hello%20Relate!%20I%20have%20a%20question."} target={"_blank"}
                          className={"inline-flex items-center gap-2 text-green-600 font-medium text-sm hover:text-green-700 transition-colors"}>
                        Ask us on WhatsApp <LuArrowRight/>
                    </Link>
                </div>
            </div>
        </section>
    )
}
