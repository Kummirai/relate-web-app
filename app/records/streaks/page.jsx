"use client";

import { useState } from "react";
import Link from "next/link";
import { FaSearch, FaFire, FaBookOpen, FaUndo, FaUserCircle, FaSpinner } from "react-icons/fa";

function formatDate(key) {
  if (!key) return "—";
  const [y, m, d] = key.split("-");
  if (!y || !m || !d) return key;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RestoreStreaksPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(null); // "prayer" | "reading" | "reset-prayer" | "reset-reading"
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [prayerTarget, setPrayerTarget] = useState("");
  const [readingTarget, setReadingTarget] = useState("");

  const search = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/streaks?search=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      setResults(json.data || []);
      setSelected(null);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const loadUser = async (u) => {
    setLoadingUser(true);
    setMessage(null);
    setError(null);
    setPrayerTarget("");
    setReadingTarget("");
    try {
      const res = await fetch(`/api/admin/streaks?userId=${encodeURIComponent(u.id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load user");
      setSelected(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingUser(false);
    }
  };

  const restore = async (kind, value) => {
    if (value === "" || value === null || value === undefined) return;
    setSaving(kind);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/streaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.user.id,
          ...(kind === "prayer" ? { prayerStreak: Number(value) } : { readingStreak: Number(value) }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to restore streak");
      await loadUser(selected.user);
      setMessage(
        kind === "prayer"
          ? `Prayer streak restored to ${json.data.prayerStreak} days.`
          : `Reading streak restored to ${json.data.readingStreak} days.`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const resetStreak = async (kind) => {
    await restore(kind, 0);
  };

  return (
    <section className="min-h-[calc(100vh-92px)]">
      <div className="max-w-6xl mx-auto pt-10 pb-20">
        <div className="mb-8">
          <Link
            href="/records"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Back to Records
          </Link>
          <h1 className="text-3xl font-medium text-gray-800 mt-2">Restore Streaks</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-2xl">
            Search for a user and restore their prayer or reading streak. Restoring a
            value backfills the last N days as complete — useful when a streak was lost
            to a sync issue or a missed day. Setting 0 clears the streak.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Search */}
        <form
          onSubmit={search}
          className="bg-white rounded-lg shadow p-6 mb-6"
        >
          <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-2">
            Find a user by name or email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                id="user-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. name or email address"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
              />
            </div>
            <button
              type="submit"
              disabled={searching || query.trim().length < 2}
              className="bg-zinc-950 text-white px-5 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              Search
            </button>
          </div>
        </form>

        {/* Search results */}
        {results.length > 0 && !selected && (
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-3 bg-zinc-950">
              <h2 className="text-xs font-medium text-gray-50 uppercase tracking-wider">
                Users found ({results.length})
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => loadUser(u)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <img
                          src={u.image}
                          alt={u.name}
                          className="size-10 rounded-full object-cover"
                        />
                      ) : (
                        <FaUserCircle className="text-3xl text-gray-300" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email || "No email"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-orange-600 font-medium">
                        <FaFire /> Prayer: {u.prayerStreak}
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <FaBookOpen /> Reading: {u.readingStreak}
                      </span>
                      <span className="text-zinc-400 text-xs">Select →</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Selected user detail */}
        {selected && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-5 bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selected.user.image ? (
                  <img
                    src={selected.user.image}
                    alt={selected.user.name}
                    className="size-11 rounded-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="text-4xl text-gray-300" />
                )}
                <div>
                  <h2 className="text-lg font-medium text-white">{selected.user.name}</h2>
                  <p className="text-sm text-gray-400">{selected.user.email || "No email"}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Change user
              </button>
            </div>

            {loadingUser ? (
              <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
                <FaSpinner className="animate-spin" />
                <span className="text-sm">Loading streaks…</span>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Prayer streak */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FaFire className="text-orange-500" /> Prayer Streak
                    </h3>
                    <span className="text-sm text-gray-500">
                      {selected.prayerDayCount} day{selected.prayerDayCount === 1 ? "" : "s"} recorded
                    </span>
                  </div>
                  <p className="text-4xl font-medium text-gray-900 mt-2">
                    {selected.prayerStreak}
                    <span className="text-base font-normal text-gray-400 ml-1">days</span>
                  </p>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                      Restore to
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="3650"
                        value={prayerTarget}
                        onChange={(e) => setPrayerTarget(e.target.value)}
                        placeholder="Days"
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
                      />
                      <button
                        onClick={() => restore("prayer", prayerTarget)}
                        disabled={saving !== null || prayerTarget === ""}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving === "prayer" ? <FaSpinner className="animate-spin" /> : <FaFire />}
                        Restore
                      </button>
                      <button
                        onClick={() => resetStreak("prayer")}
                        disabled={saving !== null}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        title="Clear all prayer streak data"
                      >
                        <FaUndo /> Reset
                      </button>
                    </div>
                  </div>
                  {selected.prayerRecentDays?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        Recent recorded days
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.prayerRecentDays.map((d) => (
                          <span
                            key={d}
                            className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded-full"
                          >
                            {formatDate(d)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reading streak */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <FaBookOpen className="text-blue-500" /> Reading Streak
                    </h3>
                    <span className="text-sm text-gray-500">
                      {selected.readingDayCount} day{selected.readingDayCount === 1 ? "" : "s"} recorded
                    </span>
                  </div>
                  <p className="text-4xl font-medium text-gray-900 mt-2">
                    {selected.readingStreak}
                    <span className="text-base font-normal text-gray-400 ml-1">days</span>
                  </p>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                      Restore to
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="3650"
                        value={readingTarget}
                        onChange={(e) => setReadingTarget(e.target.value)}
                        placeholder="Days"
                        className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
                      />
                      <button
                        onClick={() => restore("reading", readingTarget)}
                        disabled={saving !== null || readingTarget === ""}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving === "reading" ? <FaSpinner className="animate-spin" /> : <FaBookOpen />}
                        Restore
                      </button>
                      <button
                        onClick={() => resetStreak("reading")}
                        disabled={saving !== null}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        title="Clear all reading streak data"
                      >
                        <FaUndo /> Reset
                      </button>
                    </div>
                  </div>
                  {selected.readingRecentDays?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        Recent reading days
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.readingRecentDays.map((d) => (
                          <span
                            key={d}
                            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full"
                          >
                            {formatDate(d)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {results.length === 0 && !selected && !searching && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
            Search for a user above to view and restore their streaks.
          </div>
        )}
      </div>
    </section>
  );
}
