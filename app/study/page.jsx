"use client";

import Card from "@/components/bible-study/Card";
import Pagination from "@/components/pagination/Pagination";
import Tab from "@/components/tabs/Tab";
import React, { useEffect, useState } from "react";

export default function page() {
  const [selectedTab, setSelectedTab] = useState(2);
  const [data, setData] = useState([]);

  const studyMaterial = [
    { id: 1, title: "Study Plans" },
    { id: 2, title: "Series" },
    { id: 3, title: "Sermons" },
    { id: 4, title: "Devos" },
    { id: 5, title: "Articles" },
    { id: 6, title: "Books" },
    { id: 7, title: "Student Workbooks" },
    { id: 8, title: "Teacher's Guides" },
    { id: 9, title: "Audiobooks" },
    { id: 10, title: "Podcasts" },
    { id: 11, title: "Collections" },
    { id: 12, title: "Church 101" },
    { id: 13, title: "Help Guides" },
  ];

  const handleTabSelection = (id) => {
    setSelectedTab(id);
  };

  const fetchSeries = async () => {
    try {
      const response = await fetch("/api/series");
      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Failed to fetch series:", error);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [selectedTab]);

  return (
    <section className="">
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
      <div className="max-w-4xl mx-auto pb-10">
        <Tab
          studyMaterial={studyMaterial}
          handleTabSelection={handleTabSelection}
          selectedTab={selectedTab}
        />
      </div>
      <div className="max-w-6xl mx-auto grid gap-10 sm:grid-cols-3 min-h-screen">
        {data?.map((item) => {
          return <Card key={item.tag} item={item} />;
        })}
      </div>
      <div className="flex items-center justify-center h-40">
        <Pagination />
      </div>
    </section>
  );
}
