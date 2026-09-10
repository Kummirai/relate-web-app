import Link from "next/link"
import {LuMapPin, LuPhone, LuMail, LuClock, LuArrowRight} from "react-icons/lu"

export default function Contact() {
    const details = [
        {icon: <LuMapPin className={"text-2xl text-green-600"}/>, label: "Where", value: "Our community is online, everywhere"},
        {icon: <LuPhone className={"text-2xl text-green-600"}/>, label: "WhatsApp", value: "+27 78 267 7436"},
        {icon: <LuMail className={"text-2xl text-green-600"}/>, label: "Email", value: "hello@relate.app"},
        {icon: <LuClock className={"text-2xl text-green-600"}/>, label: "Rhythm", value: "Prayer times · Dawn to Dusk"},
    ]

    return (
        <section className={"py-16 md:py-24 bg-gray-50 px-4"}>
            <div className={"max-w-6xl mx-auto"}>
                <div className={"text-center mb-12 md:mb-16"}>
                    <h4 className={"text-green-600 font-medium mb-3"}>GET IN TOUCH</h4>
                    <h2 className={"text-3xl md:text-4xl font-semibold text-gray-800"}>
                        We&apos;d Love to <span className={"text-green-600"}>Hear From You</span>
                    </h2>
                    <p className={"text-gray-500 max-w-xl mx-auto mt-3"}>
                        Got a question about a club, a guide, or joining the community? Reach out — we respond quickly.
                    </p>
                </div>
                <div className={"grid grid-cols-1 lg:grid-cols-2 gap-10 items-start"}>
                    <div className={"grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                        {details.map((d, i) => (
                            <div key={i}
                                 className={"bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3"}>
                                <div className={"mt-0.5 shrink-0"}>{d.icon}</div>
                                <div>
                                    <div className={"text-sm text-gray-500"}>{d.label}</div>
                                    <div className={"font-medium text-gray-800"}>{d.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={"bg-white rounded-xl border border-gray-200 p-8"}>
                        <h3 className={"text-xl font-semibold text-gray-800 mb-4"}>Send Us a Message</h3>
                        <form className={"space-y-4"}>
                            <div className={"grid grid-cols-1 sm:grid-cols-2 gap-4"}>
                                <input type="text" placeholder="Your Name" required
                                       className={"w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"}/>
                                <input type="email" placeholder="Your Email" required
                                       className={"w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"}/>
                            </div>
                            <input type="text" placeholder="Subject"
                                   className={"w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600"}/>
                            <textarea rows={4} placeholder="Your Message" required
                                      className={"w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 resize-none"}/>
                            <Link href={"https://wa.me/27782677436?text=Hello%20Relate!%20I%27d%20like%20to%20make%20an%20enquiry."}
                                  target={"_blank"}
                                  className={"inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"}>
                                Send via WhatsApp <LuArrowRight/>
                            </Link>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
