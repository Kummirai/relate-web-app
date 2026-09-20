import {LuUsers, LuBookOpen, LuHeartHandshake, LuSun} from "react-icons/lu";

export default function Stats() {
    const stats = [
        {icon: <LuUsers className={"text-4xl"}/>, value: "7", label: "Clubs for Every Age"},
        {icon: <LuBookOpen className={"text-4xl"}/>, value: "60+", label: "Weekly Programs"},
        {icon: <LuSun className={"text-4xl"}/>, value: "360+", label: "Daily Verses & Prayers"},
        {icon: <LuHeartHandshake className={"text-4xl"}/>, value: "100%", label: "Free to Join"}
    ]

    return (
        <section className={"py-16 md:py-20 bg-navy px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"grid grid-cols-2 lg:grid-cols-4 gap-8"}>
                    {stats.map((stat, i) => (
                        <div key={i} className={"text-center text-white"}>
                            <div className={"flex justify-center mb-4"}>{stat.icon}</div>
                            <p className={"text-3xl md:text-4xl font-bold mb-1"}>{stat.value}</p>
                            <p className={"text-cyan-light text-sm md:text-base"}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
