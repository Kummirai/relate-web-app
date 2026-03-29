import About from "@/components/About";
import Hero from "@/components/Hero";
import WhatWeDo from "@/components/WhatWeDo";

export default async function page() {
  const fetchVerseOfTheDay = async () => {
    const url = "https://beta.ourmanna.com/api/v1/get?format=json&order=daily";
    const options = { method: "GET", headers: { accept: "application/json" } };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch verse of the day:", error);
      return null;
    }
  };

  const verseOfTheDay = await fetchVerseOfTheDay();
  console.log(verseOfTheDay);

  return (
    <>
      <Hero verseOfTheDay={verseOfTheDay} />
      <About />
      <WhatWeDo />
    </>
  );
}
