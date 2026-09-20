import {LuBookOpen, LuMessageCircleHeart, LuMoonStar, LuSun, LuHandHeart, LuUsers} from "react-icons/lu";

export default function Facilities() {
    const facilities = [
        {icon: <LuBookOpen className={"text-3xl text-white"}/>, label: "Verse of the Day", color: "bg-navy"},
        {icon: <LuMessageCircleHeart className={"text-3xl text-white"}/>, label: "Prayer Requests", color: "bg-blue-600"},
        {icon: <LuMoonStar className={"text-3xl text-white"}/>, label: "Bible Reading Guides", color: "bg-amber-600"},
        {icon: <LuSun className={"text-3xl text-white"}/>, label: "Daily Prayer Times", color: "bg-purple-600"},
        {icon: <LuHandHeart className={"text-3xl text-white"}/>, label: "Ask for Help", color: "bg-cyan-600"},
        {icon: <LuUsers className={"text-3xl text-white"}/>, label: "WhatsApp Communities", color: "bg-emerald-600"},
    ]

    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-cyan font-medium mb-3"}>INSIDE THE APP</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Everything You Need for <span className={"text-cyan"}>Daily Growth</span>
                    </h2>
                    <p className={"text-gray-500 max-w-xl mx-auto mt-3"}>
                        Tools that keep your faith and community close — wherever the day takes you.
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
