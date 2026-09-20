import Link from "next/link";
import { LuCalendarCheck, LuArrowRight } from "react-icons/lu";

export default function TourCta() {
  return (
    <section className={"py-16 md:py-24 bg-white px-4"}>
      <div className={"max-w-4xl mx-auto text-center"}>
        <div
          className={
            "size-20 mx-auto rounded-full bg-ice-blue flex items-center justify-center mb-6"
          }
        >
          <LuCalendarCheck className={"text-4xl text-cyan"} />
        </div>
        <h2 className={"text-3xl md:text-4xl font-bold text-gray-800 mb-4"}>
          Find Your Crew
        </h2>
        <p className={"text-gray-500 text-lg mb-8 max-w-2xl mx-auto"}>
          See the Relate family in action! Visit a club near you, meet the
          directors and members, and experience the community for yourself —
          your first visit is always free.
        </p>
        <Link
          href={
            "https://wa.me/27782677436?text=Hello%20Relate!%20I%27d%20like%20to%20visit%20a%20club."
          }
          target={"_blank"}
          className={
            "inline-flex items-center gap-2 bg-navy text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-navy-dark transition-colors"
          }
        >
          Visit a Club <LuArrowRight />
        </Link>
      </div>
    </section>
  );
}
