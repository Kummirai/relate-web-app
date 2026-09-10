import {LuBookOpen, LuMonitor, LuTrophy, LuMusic, LuCalendarClock, LuUsers} from "react-icons/lu";

export default function Facilities() {
    const facilities = [
        {icon: <LuBookOpen className={"text-3xl text-white"}/>, label: "Bible & Verses", color: "bg-green-600"},
        {icon: <LuMonitor className={"text-3xl text-white"}/>, label: "Study Guides", color: "bg-blue-600"},
        {icon: <LuCalendarClock className={"text-3xl text-white"}/>, label: "Prayer Times", color: "bg-amber-600"},
        {icon: <LuUsers className={"text-3xl text-white"}/>, label: "Club Chat", color: "bg-purple-600"},
        {icon: <LuTrophy className={"text-3xl text-white"}/>, label: "Streaks", color: "bg-cyan-600"},
        {icon: <LuMusic className={"text-3xl text-white"}/>, label: "Worship & Skills", color: "bg-emerald-600"},
    ]

    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>IN THE APP</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Built for Family <span className={"text-green-600"}>Discovery</span>
                    </h2>
                    <p className={"text-gray-500 max-w-xl mx-auto mt-3"}>
                        Everything a growing family needs — reading, prayer, chat and more.
                    </p>
                </div>
                <div className={"grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"}>
                    {facilities.map((f, i) => (
                        <div key={i}
                             className={`${f.color} rounded-xl p-6 text-center text-white hover:scale-105 transition-transform cursor-pointer`}>
                            <div className={"flex justify-center mb-3"}>{f.icon}</div>
                            <span className={"text-sm font-medium"}>{f.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
