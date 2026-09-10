import {LuChevronRight} from "react-icons/lu"
import Link from "next/link"
import {clubName} from "@/lib/catalog"

type Pub = {
    id: string
    title?: string
    clubSlug?: string
    summary?: string
    season?: {label?: string}
    year?: number
}

export default function NewsHighlights({publications}: {publications: Pub[]}) {
    return (
        <section className={"py-16 md:py-20 bg-gray-50 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"flex items-center justify-between mb-8"}>
                    <div>
                        <h4 className={"text-green-600 font-medium mb-1"}>LATEST MAGAZINES</h4>
                        <h2 className={"text-2xl md:text-3xl font-semibold text-gray-800"}>For Your Family</h2>
                    </div>
                    <Link href={"/magazines"}
                          className={"text-sm text-green-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"}>
                        View All <LuChevronRight/>
                    </Link>
                </div>
                <div className={"grid grid-cols-1 md:grid-cols-3 gap-6"}>
                    {publications.map((p) => (
                        <Link key={p.id} href={`/magazines/${p.id}`}
                              className={"bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow"}>
                            <span className={"inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700 mb-3"}>
                                {clubName(p.clubSlug)}
                            </span>
                            <h3 className={"text-base font-semibold text-gray-800 mb-2"}>{p.title}</h3>
                            <p className={"text-sm text-gray-600 leading-relaxed mb-3"}>{p.summary}</p>
                            <p className={"text-xs text-gray-400"}>{p.season?.label || p.year}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}