import Link from "next/link"
import {LuArrowRight} from "react-icons/lu"

const fees = [
    {grade: "Daily Reading", monthly: "Free", annual: "Free", featured: false},
    {grade: "Prayer Times", monthly: "Free", annual: "Free", featured: true},
    {grade: "Club Chat", monthly: "Free", annual: "Free", featured: false},
    {grade: "Skills & Community", monthly: "Free", annual: "Free", featured: false},
]

export default function FeesSection() {
    return (
        <section className={"py-16 md:py-24 bg-gray-50 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>FREE & OPEN</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Every Family, <span className={"text-green-600"}>No Fees</span>
                    </h2>
                    <p className={"text-gray-500 max-w-xl mx-auto mt-3"}>
                        Relate is free forever. Every magazine, guide, prayer time and club is open to every family.
                    </p>
                </div>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"}>
                    {fees.map((f, i) => (
                        <div key={i}
                             className={`bg-white rounded-xl p-6 shadow-sm border-2 text-center ${f.featured ? "border-green-500 relative" : "border-transparent"}`}>
                            {f.featured && (
                                <span className={"absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-medium px-4 py-1 rounded-full"}>
                                    Most Loved
                                </span>
                            )}
                            <h3 className={"text-lg font-semibold text-gray-800 mb-1"}>{f.grade}</h3>
                            <p className={"text-3xl font-bold text-green-600 mb-1"}>{f.monthly}</p>
                            <p className={"text-sm text-gray-500 mb-4"}>never a <span className={"text-gray-700"}>{f.annual}</span> cent</p>
                            <Link href={"/relate.apk"}
                                  className={`block text-sm font-medium py-2.5 rounded transition-colors ${f.featured ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                                Download Free
                            </Link>
                        </div>
                    ))}
                </div>
                <div className={"text-center"}>
                    <Link href={"/magazines"}
                          className={"inline-flex items-center gap-2 text-green-600 font-medium text-sm hover:text-green-700 transition-colors"}>
                        Explore the Magazines <LuArrowRight/>
                    </Link>
                </div>
            </div>
        </section>
    )
}
