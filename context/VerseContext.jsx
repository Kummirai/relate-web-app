"use client";

import { createContext, useContext, useEffect, useState } from "react";

const VerseContext = createContext();

const fetchVerseOfTheDay = async () => {
  const url = "https://beta.ourmanna.com/api/v1/get?format=json&order=daily";
  const options = { method: "GET", headers: { accept: "application/json" } };

  try {
    const response = await fetch(url, options);
    if (!response.ok)
      throw new Error(`Request failed with status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch verse of the day:", error);
    return null;
  }
};

export function VerseProvider({ children }) {
  const [verse, setVerse] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  const loadVerse = async () => {
    const data = await fetchVerseOfTheDay();

    if (data) {
      setVerse(data);
      setError(null);
    } else {
      setError("Failed to load verse of the day.");
    }

    setLoading(false);
  };

  // Loading starts as true in useState; only an explicit refetch (an event
  // handler) flips the flag back, so the mount effect never sets state
  // synchronously.
  const refetch = () => {
    setLoading(true);
    setError(null);
    return loadVerse();
  };

  useEffect(() => {
    let cancelled = false;
    fetchVerseOfTheDay().then((data) => {
      if (cancelled) return;
      if (data) {
        setVerse(data);
        setError(null);
      } else {
        setError("Failed to load verse of the day.");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <VerseContext.Provider
      value={{ verse, loading, error, refetch }}
    >
      {children}
    </VerseContext.Provider>
  );
}

export function useVerse() {
  const context = useContext(VerseContext);
  if (!context) throw new Error("useVerse must be used within a VerseProvider");
  return context;
}
