"use client";

import React, { useEffect, useState } from "react";

export default function Page() {
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState(50);
  const [translation, setTranslation] = useState("BSB");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [chapterContent, setChapterContent] = useState({});

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch("/api/books");
        if (!response.ok) throw new Error(`Request failed with status: ${response.status}`);
        const data = await response.json();
        setBooks(data.books);
      } catch (error) {
        console.error("Failed to fetch books:", error);
      }
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    const fetchVerses = async () => {
      const params = new URLSearchParams({
        book: selectedBook,
        chapter: selectedChapter,
        translation: translation,
      });
      try {
        const response = await fetch(`/api/verses?${params}`);
        if (!response.ok) throw new Error(`Request failed with status: ${response.status}`);
        const data = await response.json();
        setChapterContent(data);
      } catch (error) {
        console.error("Failed to fetch verses:", error);
      }
    };
    fetchVerses();
  }, [translation, selectedChapter, selectedBook]);

  const handleBookSelection = (id) => {
    const book = books.find((book) => book.id === id);
    setChapters(book.numberOfChapters);
    setSelectedBook(book.commonName);
    setSelectedChapter(1);
  };

  const handleChapterChange = (e) => setSelectedChapter(e);
  const handleTranslationChange = (e) => setTranslation(e);

  return (
    <section className="min-h-[calc(100vh-92px)]" style={{ backgroundColor: "#eff5f9" }}>
      {/* Controls bar */}
      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: "#1d2a4d1a" }}>
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex flex-wrap items-end gap-4 sm:gap-6">
            {/* Book */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#1d2a4d80" }}>
                Book
              </label>
              <select
                className="appearance-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer transition-colors"
                style={{ backgroundColor: "#eff5f9", border: "1px solid #1d2a4d1a", color: "#1d2a4d", focus: { ringColor: "#13c5dd" } }}
                onChange={(e) => handleBookSelection(e.target.value)}
              >
                {books.map((book) => (
                  <option key={book.commonName} value={book.id}>
                    {book.commonName}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="flex flex-col gap-1 min-w-[90px]">
              <label className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#1d2a4d80" }}>
                Chapter
              </label>
              <select
                name="chapter"
                id="chapter"
                className="appearance-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer transition-colors"
                style={{ backgroundColor: "#eff5f9", border: "1px solid #1d2a4d1a", color: "#1d2a4d" }}
                onChange={(e) => handleChapterChange(e.target.value)}
                value={selectedChapter}
              >
                {[...Array(chapters || 0)].map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Translation */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "#1d2a4d80" }}>
                Translation
              </label>
              <select
                className="appearance-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent cursor-pointer transition-colors"
                style={{ backgroundColor: "#eff5f9", border: "1px solid #1d2a4d1a", color: "#1d2a4d" }}
                onChange={(e) => handleTranslationChange(e.target.value)}
                value={translation}
              >
                <option value="BSB">Berean Standard Bible</option>
                <option value="eng_kja">King James Version</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Chapter heading */}
        <div className="mb-8 pb-6 border-b" style={{ borderColor: "#1d2a4d1a" }}>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "#1d2a4d80" }}>
            {translation === "BSB" ? "Berean Standard Bible" : "King James Version"}
          </p>
          <h1 className="text-3xl font-serif font-semibold tracking-tight" style={{ color: "#1d2a4d" }}>
            {selectedBook}{" "}
            <span className="font-normal" style={{ color: "#1d2a4db3" }}>{selectedChapter}</span>
          </h1>
        </div>

        {/* Scripture text */}
        <div>
          {chapterContent?.chapter?.content?.map((item, index) => {
            if (item.type === "heading") {
              return (
                <h3
                  key={index}
                  className="text-base font-semibold mt-8 mb-3 font-sans"
                  style={{ color: "#1d2a4d" }}
                >
                  {item.content[0]}
                </h3>
              );
            }

            if (item.type === "line_break") {
              return <div key={index} className="h-3" />;
            }

            if (item.type === "verse") {
              const text = item.content
                .map((part) => {
                  if (typeof part === "string") return part;
                  if (part.text) return part.text;
                  if (part.lineBreak) return "\n";
                  return "";
                })
                .join(" ");

              return (
                <p
                  key={index}
                  className="leading-8 mb-4 font-serif text-[17px]"
                  style={{ color: "#1d2a4d" }}
                >
                  <sup className="text-[11px] font-sans font-semibold mr-1 select-none" style={{ color: "#1d2a4d80" }}>
                    {item.number}
                  </sup>
                  {text}
                </p>
              );
            }

            return null;
          })}
        </div>

        {/* Bottom nav */}
        <div className="flex justify-between items-center mt-12 pt-6 border-t" style={{ borderColor: "#1d2a4d1a" }}>
          <button
            disabled={Number(selectedChapter) <= 1}
            onClick={() => handleChapterChange(Number(selectedChapter) - 1)}
            className="flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-2 rounded-md"
            style={{ color: "#1d2a4db3" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "#1d2a4d80" }}>
            Chapter {selectedChapter} of {chapters}
          </span>
          <button
            disabled={Number(selectedChapter) >= chapters}
            onClick={() => handleChapterChange(Number(selectedChapter) + 1)}
            className="flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-2 rounded-md"
            style={{ color: "#1d2a4db3" }}
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}