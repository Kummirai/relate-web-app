import About from "@/components/home/About";
import CallToAction from "@/components/home/CallToAction";
import Hero from "@/components/home/Hero";
import WhatWeDo from "@/components/home/WhatWeDo";

export default async function page() {
  return (
    <div className="flex flex-col">
      <Hero />
      <About />
      <WhatWeDo />
      <CallToAction />
    </div>
  );
}
