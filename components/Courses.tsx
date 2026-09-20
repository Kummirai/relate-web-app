import Link from "next/link"
import {LuArrowRight} from "react-icons/lu";

export default function Courses() {
    const courses = [
        {
            title: "Sprout",
            description: "Children in their formative years — needing nurturing, guidance, education support and a safe environment to grow.",
            duration: "6–15 yrs · Children",
            students: 9,
            color: "bg-[#4CAF50]/10 text-[#2E7D32]"
        },
        {
            title: "Surge",
            description: "Young people stepping into adulthood — needing guidance, skills and purpose.",
            duration: "16–21 yrs · Young Youth",
            students: 9,
            color: "bg-[#FF6B00]/10 text-[#C2410C]"
        },
        {
            title: "Pulse",
            description: "Young adults building careers, finances and identity — needing network and direction.",
            duration: "21–33 yrs · Youth",
            students: 9,
            color: "bg-[#00B4D8]/10 text-[#0284C7]"
        },
        {
            title: "Prime",
            description: "Mature singles thriving independently — needing community and purpose.",
            duration: "33+ yrs · Singles",
            students: 9,
            color: "bg-[#6C2BD9]/10 text-[#4A148C]"
        },
        {
            title: "Anchor",
            description: "Single parents raising children alone — needing support, community and practical help.",
            duration: "Parenting but single",
            students: 10,
            color: "bg-[#2E7D32]/10 text-[#14532D]"
        },
        {
            title: "Base",
            description: "Couples building life together — needing support, connection and growth.",
            duration: "Couples of any age",
            students: 9,
            color: "bg-[#E8A2B6]/20 text-[#9D174D]"
        },
        {
            title: "Nexus",
            description: "Families raising children — needing community, resources and stability.",
            duration: "Families",
            students: 9,
            color: "bg-[#8A9A5B]/10 text-[#4D7C0F]"
        },
        {
            title: "Not sure where you fit?",
            description: "Message us and we'll help you find the right club for your season of life — every age is welcome.",
            duration: "Everyone",
            students: 0,
            color: "bg-ice-blue text-cyan"
        }
    ]

    return (
        <section className={"py-16 md:py-24 bg-gray-50 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-cyan font-medium mb-3"}>OUR CLUBS</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Find Your Crew For <br className={"hidden sm:block"}/>
                        Every Stage
                    </h2>
                </div>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
                    {courses.map((course, i) => (
                        <div key={i}
                             className={"bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"}>
                            <div
                                className={`inline-block px-3 py-1 rounded text-xs font-medium mb-4 ${course.color}`}>
                                {course.duration}
                            </div>
                            <h3 className={"text-lg font-semibold text-gray-800 mb-2"}>{course.title}</h3>
                            <p className={"text-gray-600 text-sm leading-relaxed mb-4"}>{course.description}</p>
                            <div className={"flex items-center justify-between"}>
                                <span className={"text-sm text-gray-500"}>{course.students > 0 ? `${course.students} Programs` : ""}</span>
                                <Link href={i === courses.length - 1 ? "/enroll" : `/${course.title.toLowerCase()}`}
                                      className={"text-cyan text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"}>
                                    Learn More <LuArrowRight/>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
