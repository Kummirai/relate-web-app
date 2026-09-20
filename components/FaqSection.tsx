"use client"

import {useState} from "react"
import Link from "next/link"
import {LuChevronDown, LuArrowRight} from "react-icons/lu"

const faqs = [
    {
        q: "Is Relate really free to join?",
        a: "Yes. Every club, weekly program and prayer time is completely free. Sponsorship covers school fees, uniforms and meals for families who need a hand — no one pays to belong."
    },
    {
        q: "Which club is right for me or my family?",
        a: "There's a club for every season of life: Sprout (children 6–15), Surge (16–21), Pulse (21–33), Prime (singles 33+), Anchor (single parents), Base (couples) and Nexus (families). Message us on WhatsApp and we'll help you find your crew."
    },
    {
        q: "What happens at a typical club gathering?",
        a: "Each club meets weekly — games, real conversations and practical skills, with an optional faith component. Sprout runs Saturday morning activities, Pulse hosts monthly networking, Nexus shares potluck dinners. Every program serves a meal or snack."
    },
    {
        q: "Do I need to be religious to join?",
        a: "Not at all. Prayer groups, worship nights and Bible study are optional and open to everyone. Most members come for the community, the skills and the support — faith is there if and when you want it."
    },
]

export default function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-3xl mx-auto"}>
                <div className={"text-center mb-12"}>
                    <h4 className={"text-cyan font-medium mb-3"}>FAQ</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Frequently Asked <span className={"text-cyan"}>Questions</span>
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
                    <Link href={"/faq"}
                          className={"inline-flex items-center gap-2 text-cyan font-medium text-sm hover:text-cyan-dark transition-colors"}>
                        View All FAQs <LuArrowRight/>
                    </Link>
                </div>
            </div>
        </section>
    )
}
