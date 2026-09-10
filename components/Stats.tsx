import {LuUsers, LuBookOpen, LuHeartHandshake, LuCalendar} from "react-icons/lu";

export default function Stats() {
    const stats = [
        {icon: <LuUsers className={"text-4xl"}/>, value: "10", label: "Clubs & Counting"},
        {icon: <LuBookOpen className={"text-4xl"}/>, value: "91", label: "Days in a Season Guide"},
        {icon: <LuHeartHandshake className={"text-4xl"}/>, value: "5", label: "Magazines Published"},
        {icon: <LuCalendar className={"text-4xl"}/>, value: "24/7", label: "Prayer & Reminders"}
    ]

    return (
        <section className={"py-16 md:py-20 bg-green-600 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-8"}>
                    {stats.map((stat, i) => (
                        <div key={i} className={"text-center text-white"}>
                            <div className={"flex justify-center mb-4"}>{stat.icon}</div>
                            <p className={"text-3xl md:text-4xl font-bold mb-1"}>{stat.value}</p>
                            <p className={"text-green-100 text-sm md:text-base"}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
