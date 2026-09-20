import Hero from "@/components/Hero";
import Learn from "@/components/Learn";
import WhyChooseUs from "@/components/WhyChooseUs";
import EnrollCta from "@/components/EnrollCta";
import Events from "@/components/Events";
import Facilities from "@/components/Facilities";
import NewsHighlights from "@/components/NewsHighlights";
import Team from "@/components/Team";
import Testimonials from "@/components/Testimonials";
import FaqSection from "@/components/FaqSection";
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
      <EnrollCta />
      <Events />
      <Facilities />
      <NewsHighlights publications={latest} />
      <Team />
      <Testimonials />
      <FaqSection />
      <Contact />
    </>
  );
}