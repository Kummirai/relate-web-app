import Link from "next/link"

export default function EnrollCta() {
    return (
        <section className={"bg-gradient-to-br from-green-600 via-green-700 to-green-800 px-4"}>
            <div className={"max-w-4xl mx-auto py-20 text-center"}>
                <h2 className={"text-3xl md:text-4xl font-bold text-white mb-4"}>
                    Ready to Grow Together?
                </h2>
                <p className={"text-green-100 text-lg mb-8 max-w-2xl mx-auto"}>
                    Pick a club, open the latest magazine, and start the day with a short verse for the whole family.
                </p>
                <div className={"flex items-center justify-center gap-4 flex-wrap"}>
                    <Link href={"/magazines"}
                          className={"bg-yellow-400 text-green-900 py-3 px-10 text-lg font-semibold hover:bg-yellow-500 transition-colors"}>
                        Browse Magazines
                    </Link>
                    <Link href={"/relate.apk"}
                          className={"bg-white/20 text-white py-3 px-10 text-lg font-medium hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/30"}>
                        Download the App
                    </Link>
                </div>
            </div>
        </section>
    )
}
