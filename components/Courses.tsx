import Link from "next/link"
import {LuArrowRight} from "react-icons/lu";
import {CLUBS} from "@/lib/catalog";

export default function Courses() {
    return (
        <section className={"py-16 md:py-24 bg-gray-50 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>OUR CLUBS</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        A Club For <br className={"hidden sm:block"}/>
                        Every Season
                    </h2>
                </div>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
                    {CLUBS.map((club) => (
                        <div key={club.slug}
                             className={"bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"}>
                            <div
                                className={"inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium mb-4"}
                                style={{background: `${club.color}1a`, color: club.color}}>
                                <span className={"size-2 rounded-full"} style={{background: club.color}}/>
                                {club.slug}
                            </div>
                            <h3 className={"text-lg font-semibold text-gray-800 mb-2"}>{club.name}</h3>
                            <p className={"text-gray-600 text-sm leading-relaxed mb-4"}>{club.tagline}</p>
                            <div className={"flex items-center justify-between"}>
                                <span className={"text-sm text-gray-500"}>Reading & chat</span>
                                <Link href={`/magazines?club=${club.slug}`}
                                      className={"text-green-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"}>
                                    Explore <LuArrowRight/>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}