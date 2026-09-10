import {LuHeart, LuUsers, LuShield, LuSparkles} from "react-icons/lu";

export default function Learn() {
    const features = [
        {
            icon: <LuHeart className={"text-4xl text-green-600"}/>,
            title: "Daily Prayer Times",
            description: "Dawn to dusk together — prayer reminders the whole family can gather around."
        },
        {
            icon: <LuSparkles className={"text-4xl text-green-600"}/>,
            title: "Seasonal Study Guides",
            description: "A short read and a verse for every day — 91 days of growing through each season."
        },
        {
            icon: <LuUsers className={"text-4xl text-green-600"}/>,
            title: "Clubs for Every Stage",
            description: "From little ones to parents, each club has its own magazines, chat and daily reading."
        },
        {
            icon: <LuShield className={"text-4xl text-green-600"}/>,
            title: "Community & Skills",
            description: "Workshops, WhatsApp community and skills training that help families thrive together."
        }
    ]

    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>WHAT IS RELATE</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Faith That Fits Into <br className={"hidden sm:block"}/>
                        Everyday Life
                    </h2>
                </div>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"}>
                    {features.map((feature, i) => (
                        <div key={i}
                             className={"bg-gray-50 p-6 rounded-lg text-center hover:shadow-lg transition-shadow duration-300"}>
                            <div className={"mb-4 flex justify-center"}>{feature.icon}</div>
                            <h3 className={"text-lg font-semibold text-gray-800 mb-2"}>{feature.title}</h3>
                            <p className={"text-gray-600 text-sm leading-relaxed"}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
