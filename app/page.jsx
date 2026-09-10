import Hero from "@/components/Hero";
import Learn from "@/components/Learn";
import WhyChooseUs from "@/components/WhyChooseUs";
import Stats from "@/components/Stats";
import Courses from "@/components/Courses";
import EnrollCta from "@/components/EnrollCta";
import Events from "@/components/Events";
import PhotoHighlights from "@/components/PhotoHighlights";
import Facilities from "@/components/Facilities";
import NewsHighlights from "@/components/NewsHighlights";
import FeesSection from "@/components/FeesSection";
import Team from "@/components/Team";
import Testimonials from "@/components/Testimonials";
import FaqSection from "@/components/FaqSection";
import TourCta from "@/components/TourCta";
import Contact from "@/components/Contact";
import { listPublications } from "@/lib/publications";

export const metadata = {
  title: "Relate — Grow Together as a Family",
  description:
    "Prayer times, daily Bible reading, seasonal study guides, family clubs and community — together in one app.",
};

export default async function Home() {
  const latest = await listPublications({ limit: 3 });

  return (
    <>
      <Hero />
      <Learn />
      <WhyChooseUs />
      <Stats />
      <Courses />
      <EnrollCta />
      <Events />
      <PhotoHighlights />
      <Facilities />
      <NewsHighlights publications={latest} />
      <FeesSection />
      <Team />
      <Testimonials />
      <FaqSection />
      <TourCta />
      <Contact />
    </>
  );
}