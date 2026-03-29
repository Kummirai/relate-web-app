import Card from "@/components/bible-study/Card";
import React from "react";

export default async function page() {
  const fetchSeries = async () => {
    try {
      const response = await fetch("https://bibletalk.tv/series.json");
      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch verse of the day:", error);
      return null;
    }
  };

  const series = await fetchSeries();

  return (
    <section className=" pb-20">
      <div className="pb-10">
        <h5 className="text-4xl md:text-5xl font-medium max-w-212.5 text-center mx-auto mt-8">
          Study God's Word
        </h5>

        <p className="text-sm md:text-base mx-auto max-w-2xl text-center mt-6 max-md:px-2">
          We believe we are stronger together. Through prayer and genuine
          relationship, we walk alongside families — trusting God for
          breakthroughs none of us could find alone.
        </p>
      </div>
      <div className="max-w-6xl mx-auto grid gap-10 grid-cols-3 min-h-screen">
        {series.map((item) => {
          return <Card key={item.tag} item={item} />;
        })}
      </div>
    </section>
  );
}
