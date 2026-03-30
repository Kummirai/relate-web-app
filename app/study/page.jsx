"use client";

import Card from "@/components/bible-study/Card";
import Tab from "@/components/tabs/Tab";
import React, { Suspense, useEffect, useState } from "react";
import Loading from "./my-loading";

const PAGE_SIZE = 9;

export default function page() {
  const [selectedTab, setSelectedTab] = useState(10);
  const [data, setData] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);

  const studyMaterial = [
    { id: 1, title: "Study Plans", api: "study-plans" },
    { id: 2, title: "Series", api: "series" },
    { id: 3, title: "Sermons", api: "sermons" },
    { id: 4, title: "Devos", api: "devos" },
    { id: 5, title: "Articles", api: "articles" },
    { id: 6, title: "Books", api: "books" },
    { id: 7, title: "Student Workbooks", api: "student-workbooks" },
    { id: 8, title: "Teacher's Guides", api: "guides" },
    { id: 9, title: "Audiobooks", api: "audiobooks" },
    { id: 10, title: "Podcasts", api: "podcasts" },
    { id: 11, title: "Collections", api: "collections" },
    { id: 12, title: "Church 101", api: "101" },
    { id: 13, title: "Help Guides", api: "help-guides" },
  ];

  const handleTabSelection = (id) => {
    setSelectedTab(id);
    setVisibleCount(PAGE_SIZE);
  };

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/${studyMaterial[selectedTab - 1].api}`,
      );
      if (!response.ok) {
        throw new Error(`Request failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      setData(data);
    } catch (error) {
      console.error("Failed to fetch series:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [selectedTab]);

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

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

      {selectedTab && (
        <Suspense fallback={<Loading />}>
          {loading ? (
            <Loading />
          ) : (
            <div className="max-w-6xl mx-auto grid gap-10 sm:grid-cols-3 min-h-screen">
              {visibleData?.map((item) => (
                <Card key={item.tag} item={item} />
              ))}
            </div>
          )}
        </Suspense>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="flex items-center justify-center h-40">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 border bg-white border-gray-300 rounded-md text-sm font-medium hover:bg-zinc-950 hover:text-white cursor-pointer transition-colors"
          >
            Load More {studyMaterial[selectedTab - 1].title} (
            {data.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
