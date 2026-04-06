"use client";

import React, { useEffect, useState } from "react";

export default function page() {
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
        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`);
        }

        const data = await response.json();

        console.log(data);

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
        const response = await fetch(
          `http://localhost:3000/api/verses?${params}`,
        );

        if (!response.ok) {
          throw new Error(`Request failed with status: ${response.status}`);
        }

        const data = await response.json();

        console.log(data.chapter.content[0]);
        setChapterContent(data);
      } catch (error) {
        console.error("Failed to fetch books:", error);
      }
    };

    fetchVerses();
  }, [translation, selectedChapter, selectedBook]);

  const handleBookSelection = (id) => {
    const book = books.find((book) => book.id === id);
    setChapters(book.numberOfChapters);
    setSelectedBook(book.commonName);
  };

  const handleChapterChange = (e) => {
    console.log(e);
    setSelectedChapter(e);
  };

  const handleTranslationChange = (e) => {
    setTranslation(e);
  };

  return (
    <section className="min-h-[calc(100vh-92px)]">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-10">
          <div className="flex flex-col w-100 mx-auto border ">
            <label htmlFor="">
              <span>Book</span>
            </label>
            <select
              name=""
              id=""
              className="z-2"
              onChange={(e) => handleBookSelection(e.target.value)}
            >
              {books.map((book) => {
                return (
                  <option key={book.commonName} value={book.id}>
                    {book.commonName}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex flex-col w-100 mx-auto border">
            <label htmlFor="">
              <span>Chapter</span>
            </label>
            <select
              name="chapter"
              id="chapter"
              onChange={(e) => handleChapterChange(e.target.value)}
            >
              {[...Array(chapters || 0)].map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col w-100 mx-auto">
            <label htmlFor="">
              <span>Translation</span>
            </label>
            <select
              name=""
              id=""
              onChange={(e) => handleTranslationChange(e.target.value)}
            >
              <option value={"BSB"}>BSB</option>
              <option value={"eng_kja"}>King James Version</option>
            </select>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="my-5">
            <h3 className="flex items-center gap-5">
              <span>{selectedBook}</span>
              <span>{selectedChapter}</span>
              <span>{translation}</span>
            </h3>
          </div>
          <div className="bg-white py-10 px-20 mb-10">
            {chapterContent?.chapter?.content?.map((item, index) => {
              if (item.type === "heading") {
                return (
                  <h3 className="text-md font-semibold" key={index}>
                    {item.content[0]}
                  </h3>
                );
              }

              if (item.type === "line_break") {
                return <br key={index} />;
              }

              if (item.type === "verse") {
                const text = item.content
                  .map((part) => {
                    if (typeof part === "string") return part;
                    if (part.text) return part.text; // poem lines
                    if (part.lineBreak) return "\n"; // inline line break
                    return ""; // noteId — skip
                  })
                  .join(" ");

                return (
                  <p key={index}>
                    <sup>{item.number}</sup> {text}
                  </p>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
