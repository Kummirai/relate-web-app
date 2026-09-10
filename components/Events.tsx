import {LuCalendar, LuChevronRight} from "react-icons/lu"
import Link from "next/link"

const events = [
    {date: "05:30", title: "Dawn", desc: "Begin the day with gratitude", color: "bg-blue-100 text-blue-700"},
    {date: "08:00", title: "Sunrise", desc: "A short opening prayer", color: "bg-purple-100 text-purple-700"},
    {date: "12:00", title: "Noon", desc: "Press pause and pray together", color: "bg-pink-100 text-pink-700"},
    {date: "19:30", title: "Dusk", desc: "Family reading before rest", color: "bg-cyan-100 text-cyan-700"},
]

export default function Events() {
    return (
        <section className={"py-16 md:py-20 bg-white px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"flex items-center justify-between mb-8"}>
                    <div>
                        <h4 className={"text-green-600 font-medium mb-1"}>DAILY RHYTHM</h4>
                        <h2 className={"text-2xl md:text-3xl font-semibold text-gray-800"}>Prayer Times</h2>
                    </div>
                    <Link href={"/magazines"}
                          className={"text-sm text-green-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"}>
                        Start Reading <LuChevronRight/>
                    </Link>
                </div>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"}>
                    {events.map((e, i) => (
                        <div key={i}
                             className={"flex gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"}>
                            <div className={"shrink-0 text-center bg-green-600 text-white rounded-lg px-3 py-2 min-w-16"}>
                                <p className={"text-xs leading-tight"}>{e.date.split(" ")[0]}</p>
                                <p className={"text-sm font-bold"}>{e.date.split(" ")[1]}</p>
                            </div>
                            <div>
                                <h3 className={"text-sm font-semibold text-gray-800"}>{e.title}</h3>
                                <p className={"text-xs text-gray-500 mt-0.5"}>{e.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
