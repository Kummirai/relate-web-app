import Link from "next/link"
import {LuArrowRight} from "react-icons/lu"
import {STORE_ITEMS} from "@/constants/relate"

const formatPrice = (n: number) => `R ${n.toLocaleString("en-ZA")}`

const featuredIds = ["relate-tee", "club-hoodie", "faith-cap", "study-notebook"]

const items = featuredIds
    .map((id) => STORE_ITEMS.find((s) => s.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item, i) => ({item, featured: i === 1}))

export default function FeesSection() {
    return (
        <section className={"py-16 md:py-24 bg-gray-50 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-cyan font-medium mb-3"}>RELATE STORE</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        Wear the <span className={"text-cyan"}>Family</span>
                    </h2>
                    <p className={"text-gray-500 max-w-xl mx-auto mt-3"}>
                        Every purchase raises funds for Relate clubs and community programs. Order on WhatsApp and we&rsquo;ll sort out the rest.
                    </p>
                </div>
                <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"}>
                    {items.map(({item, featured}) => (
                        <div key={item.id}
                             className={`bg-white rounded-xl p-6 shadow-sm border-2 text-center flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${featured ? "border-cyan relative" : "border-transparent"}`}>
                            {featured && (
                                <span className={"absolute -top-3 left-1/2 -translate-x-1/2 bg-navy text-white text-xs font-medium px-4 py-1 rounded-full z-10"}>
                                    Most Popular
                                </span>
                            )}
                            <a href={`/store/${item.id}`} className={"block aspect-square overflow-hidden mb-4 bg-gray-100 group"}>
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className={"size-full object-cover group-hover:scale-105 transition-transform duration-500"}
                                />
                            </a>
                            <h3 className={"text-lg font-semibold text-gray-800 mb-1"}>
                                <a href={`/store/${item.id}`} className="hover:text-cyan-dark transition-colors">{item.name}</a>
                            </h3>
                            <p className={"text-3xl font-bold text-cyan mb-1"}>{formatPrice(item.price)}</p>
                            <p className={"text-sm text-gray-500 mb-4 flex-1"}>{item.blurb}</p>
                            <div className={"flex flex-col gap-2 mt-auto"}>
                                <a href={`/store/checkout?item=${item.id}`}
                                   className={`block text-sm font-medium py-2.5 rounded transition-colors ${featured ? "bg-navy text-white hover:bg-navy-dark" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                                    Order now
                                </a>
                                <a href={`/store/${item.id}`}
                                   className="block text-xs font-medium text-slate-gray hover:text-navy transition-colors">
                                    View details
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={"text-center"}>
                    <Link href={"/store"}
                          className={"inline-flex items-center gap-2 text-cyan font-medium text-sm hover:text-cyan-dark transition-colors"}>
                        Browse the Full Store <LuArrowRight/>
                    </Link>
                </div>
            </div>
        </section>
    )
}
