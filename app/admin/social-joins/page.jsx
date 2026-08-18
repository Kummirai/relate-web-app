"use client";

import { useEffect, useState } from "react";

type JoinRequest = {
  _id: string;
  userId: string;
  name: string;
  relationship: string;
  skill: string;
  source: string;
  ageRange: string;
  status: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  single: "Single",
  married: "Married",
  in_a_relationship: "In a relationship",
};

export default function SocialJoinsAdmin() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/community/social-join${params}`);
      const json = await res.json();
      setRequests(json.data || []);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      await fetch(`/api/community/social-join/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch {}
    setProcessing(null);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              WhatsApp Community Joins
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and approve join requests
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <span className="text-2xl" role="img" aria-label="notifications">
                🔔
              </span>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {["pending", "approved", "rejected", ""].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? "bg-[#13c5dd] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {status
                ? status.charAt(0).toUpperCase() + status.slice(1)
                : "All"}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No {filter || ""} requests found.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {req.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[req.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400">Status:</span>{" "}
                        {RELATIONSHIP_LABELS[req.relationship] || req.relationship}
                      </div>
                      <div>
                        <span className="text-gray-400">Skill:</span>{" "}
                        {req.skill}
                      </div>
                      <div>
                        <span className="text-gray-400">Source:</span>{" "}
                        {req.source}
                      </div>
                      <div>
                        <span className="text-gray-400">Age:</span>{" "}
                        {req.ageRange}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Submitted{" "}
                      {new Date(req.createdAt).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleAction(req._id, "approve")}
                        disabled={processing === req._id}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition"
                      >
                        {processing === req._id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleAction(req._id, "reject")}
                        disabled={processing === req._id}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
                      >
                        {processing === req._id ? "..." : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
