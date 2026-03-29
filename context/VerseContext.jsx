// context/VerseContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

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
    setLoading(true);
    setError(null);

    const data = await fetchVerseOfTheDay();

    if (data) {
      setVerse(data);
    } else {
      setError("Failed to load verse of the day.");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadVerse();
  }, []);

  return (
    <VerseContext.Provider
      value={{ verse, loading, error, refetch: loadVerse }}
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
