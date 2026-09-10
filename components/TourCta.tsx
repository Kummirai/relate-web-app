import Link from "next/link"
import {LuCalendarCheck, LuArrowRight} from "react-icons/lu"

export default function TourCta() {
    return (
        <section className={"py-16 md:py-24 bg-white px-4"}>
            <div className={"max-w-4xl mx-auto text-center"}>
                <div
                    className={"size-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6"}>
                    <LuCalendarCheck className={"text-4xl text-green-600"}/>
                </div>
                <h2 className={"text-3xl md:text-4xl font-bold text-gray-800 mb-4"}>
                    Start Today
                </h2>
                <p className={"text-gray-500 text-lg mb-8 max-w-2xl mx-auto"}>
                    Open a magazine, join your club&apos;s WhatsApp community, and begin the season&apos;s
                    reading with your family this evening.
                </p>
                <Link href={"https://wa.me/27782677436?text=Hello%20Relate!%20I%27d%20like%20to%20join%20a%20club."}
                      target={"_blank"}
                      className={"inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"}>
                    Join a Club on WhatsApp <LuArrowRight/>
                </Link>
            </div>
        </section>
    )
}
