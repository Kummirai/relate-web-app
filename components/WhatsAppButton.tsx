import {FaWhatsapp} from "react-icons/fa"
import Link from "next/link"

export default function WhatsAppButton() {
    return (
        <Link href={"https://wa.me/27782677436?text=Hello%20Relate!%20I%27d%20like%20to%20join%20a%20club."}
              target={"_blank"}
              className={"fixed bottom-6 right-6 z-40 size-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300"}>
            <FaWhatsapp className={"text-3xl"}/>
        </Link>
    )
}