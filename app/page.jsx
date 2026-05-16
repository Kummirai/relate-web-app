import About from "@/components/home/About";
import CallToAction from "@/components/home/CallToAction";
import ContactSection from "@/components/home/ContactSection";
import DonateSupport from "@/components/home/DonateSupport";
import FAQ from "@/components/home/FAQ";
import Gallery from "@/components/home/Gallery";
import Hero from "@/components/home/Hero";
import Partners from "@/components/home/Partners";
import PrayerRequest from "@/components/home/PrayerRequest";
import ProgramsServices from "@/components/home/ProgramsServices";
import SkillsSection from "@/components/home/SkillsSection";
import Statistics from "@/components/home/Statistics";
import TeamSection from "@/components/home/TeamSection";
import Testimonials from "@/components/home/Testimonials";
import UpcomingEvents from "@/components/home/UpcomingEvents";
import Volunteer from "@/components/home/Volunteer";
import WhatWeDo from "@/components/home/WhatWeDo";

export default async function page() {
  return (
    <div className="flex flex-col">
      <Hero />
      <About />
      <WhatWeDo />
      <Statistics />
      <ProgramsServices />
      <SkillsSection />
      <Testimonials />
      <TeamSection />
      <Gallery />
      <UpcomingEvents />
      <Volunteer />
      <Partners />
      <PrayerRequest />
      <FAQ />
      <DonateSupport />
      <CallToAction />
      <ContactSection />
    </div>
  );
}
