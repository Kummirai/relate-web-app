import {LuCalendar, LuChevronRight} from "react-icons/lu"
import Link from "next/link"

const events = [
    {date: "Sat", title: "Sprout Club Morning", desc: "Games, crafts and stories for ages 6–15", color: "bg-blue-100 text-blue-700"},
    {date: "Fri", title: "Surge Fire Worship Night", desc: "Monthly worship, testimony and prayer", color: "bg-purple-100 text-purple-700"},
    {date: "Thu", title: "Pulse Network Meetup", desc: "Grow your network — bring a friend", color: "bg-pink-100 text-pink-700"},
    {date: "Sun", title: "Nexus Family Table", desc: "Potluck dinner — nobody eats alone", color: "bg-cyan-100 text-cyan-700"},
]

export default function Events() {
    return (
        <section className={"py-16 md:py-20 bg-white px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"flex items-center justify-between mb-8"}>
                    <div>
                        <h4 className={"text-cyan font-medium mb-1"}>WEEKLY RHYTHM</h4>
                        <h2 className={"text-2xl md:text-3xl font-semibold text-gray-800"}>What&rsquo;s Happening</h2>
                    </div>
                    <Link href={"/calendar"}
                          className={"text-sm text-cyan font-medium flex items-center gap-1 hover:gap-2 transition-all"}>
                        View All <LuChevronRight/>
                    </Link>
                </div>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"}>
                    {events.map((e, i) => (
                        <div key={i}
                             className={"flex gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"}>
                            <div className={"shrink-0 text-center bg-navy text-white rounded-lg px-3 py-2 w-16"}>
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
