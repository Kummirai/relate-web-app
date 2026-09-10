import {IoStarSharp} from "react-icons/io5";

export default function Testimonials() {
    const testimonials = [
        {
            quote: "Relate made it easy to bring our family together for a few minutes each morning. The kids look forward to their club's guide.",
            name: "Thandi Mokoena",
            role: "Parent of Sprout readers",
            initials: "TM"
        },
        {
            quote: "I love reading my Surge magazine every day. The quizzes keep me doing the reading even on busy school days.",
            name: "Liam Botha",
            role: "Surge club member",
            initials: "LB"
        },
        {
            quote: "The seasonal guides fit our rhythm perfectly. Prayer times, the verse, a reflection — it all connects our church and home life.",
            name: "Priya Naidoo",
            role: "Anchor club member",
            initials: "PN"
        }
    ]

    return (
        <section className={"py-16 md:py-24 bg-gray-50 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>TESTIMONIALS</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        What Families <br className={"hidden sm:block"}/>
                        Say About Us
                    </h2>
                </div>
                <div className={"grid grid-cols-1 md:grid-cols-3 gap-6"}>
                    {testimonials.map((t, i) => (
                        <div key={i}
                             className={"bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow"}>
                            <div className={"flex gap-1 text-amber-400 mb-4"}>
                                {[...Array(5)].map((_, j) => (
                                    <IoStarSharp key={j}/>
                                ))}
                            </div>
                            <p className={"text-gray-600 text-sm leading-relaxed mb-6"}>
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className={"flex items-center gap-3"}>
                                <div
                                    className={"size-10 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold"}>
                                    {t.initials}
                                </div>
                                <div>
                                    <h4 className={"font-semibold text-gray-800 text-sm"}>{t.name}</h4>
                                    <p className={"text-gray-500 text-xs"}>{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
