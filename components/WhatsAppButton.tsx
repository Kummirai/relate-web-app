import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";

export default function WhatsAppButton() {
  return (
    <Link
      href={
        "https://wa.me/27782677436?text=Hello%20RelateWorld!%20I%27d%20like%20to%20enquire%20about%20enrolling%20my%20child."
      }
      target={"_blank"}
      className={
        "fixed bottom-6 right-6 z-40 size-14 rounded-full bg-navy text-white flex items-center justify-center shadow-lg hover:bg-navy-dark hover:scale-110 transition-all duration-300"
      }
    >
      <FaWhatsapp className={"text-3xl"} />
    </Link>
  );
}
