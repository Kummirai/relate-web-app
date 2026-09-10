"use client"

import {LuBookOpen, LuSparkles, LuHeartHandshake} from "react-icons/lu"
import {useState} from "react"
import Link from "next/link"

const steps = [
    {
        title: "Read",
        subtitle: "One short passage a day",
        description: "Each day opens with a verse and a short read from the season's guide — two minutes for the whole family.",
        src: "https://images.unsplash.com/photo-1513486404782-2c4ba756e117?w=200&h=200&fit=crop&crop=face",
    },
    {
        title: "Reflect",
        subtitle: "A question to linger on",
        description: "Checklists, quizzes and reflections help the words settle in before the day moves on.",
        src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop&crop=face",
    },
    {
        title: "Respond",
        subtitle: "Pray and carry it with you",
        description: "A closing prayer turns reading into action — for your family, your church, and your neighbours.",
        src: "https://images.unsplash.com/photo-1476234251651-f353703a034d?w=200&h=200&fit=crop&crop=face",
    },
]

export default function Team() {
    const [visible, setVisible] = useState(true)

    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-5xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>THE DAILY READ</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Read, Reflect <br className={"hidden sm:block"}/>
                        <span className={"text-green-600"}>and Respond</span>
                    </h2>
                    <p className={"text-gray-500 max-w-xl mx-auto mt-3"}>
                        A gentle rhythm that turns a few minutes a day into a season of growth.
                    </p>
                </div>
                <div className={"grid grid-cols-1 md:grid-cols-3 gap-6"}>
                    {steps.map((step, i) => (
                        <div key={i}
                             className={"text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow"}>
                            <div
                                className={"size-24 mx-auto rounded-full overflow-hidden mb-5 ring-4 ring-green-100 group-hover:scale-105 transition-transform duration-300"}>
                                <img src={step.src} alt={step.title}
                                     className={"size-full object-cover"}/>
                            </div>
                            <h3 className={"text-xl font-semibold text-gray-800 flex items-center justify-center gap-2"}>
                                {i === 0 ? <LuBookOpen className={"text-green-600"}/> : i === 1 ? <LuSparkles className={"text-green-600"}/> : <LuHeartHandshake className={"text-green-600"}/>}
                                {step.title}
                            </h3>
                            <p className={"text-green-600 text-sm mb-2"}>{step.subtitle}</p>
                            <p className={"text-gray-600 text-sm leading-relaxed"}>{step.description}</p>
                        </div>
                    ))}
                </div>
                {visible && (
                    <div className={"text-center mt-8"}>
                        <Link href={"/magazines"}
                              className={"px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors"}>
                            Start Today&apos;s Read
                        </Link>
                    </div>
                )}
            </div>
        </section>
    )
}