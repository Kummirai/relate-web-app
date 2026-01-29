"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecordForm({ initialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    recordId: initialData?.recordId || `REC-${Date.now()}`,
    dateOfIntake: initialData?.dateOfIntake || "",
    caseManager: initialData?.caseManager || "",
    headOfHousehold: initialData?.headOfHousehold || "",
    contactNumber: initialData?.contactNumber || "",
    alternateContactNumber: initialData?.alternateContactNumber || "",
    emailAddress: initialData?.emailAddress || "",
    physicalAddress: initialData?.physicalAddress || "",
    preferredContactMethod: initialData?.preferredContactMethod || [],
    householdMembers: initialData?.householdMembers || [],
    summary: initialData?.summary || "",
    urgencyLevel: initialData?.urgencyLevel || "Medium",
    immediateNeeds: initialData?.immediateNeeds || [],
    longTermNeeds: initialData?.longTermNeeds || [],
    actionLog: initialData?.actionLog || [],
    reasonForClosure: initialData?.reasonForClosure || "",
    finalOutcome: initialData?.finalOutcome || "",
  });

  const immediateNeedsOptions = [
    "Food Assistance",
    "Shelter",
    "Utility Bills",
    "Clothing",
    "Medical/Hygiene",
    "Child Tuition",
    "Other",
  ];

  const longTermNeedsOptions = [
    "Employment",
    "Education",
    "Financial Literacy",
    "Housing",
    "Healthcare",
    "Social Services",
    "Other",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/records", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/records");
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving record:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Family & Contact Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">
          Section 1: Family & Contact Information
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Record ID</label>
            <input
              type="text"
              value={formData.recordId}
              onChange={(e) =>
                setFormData({ ...formData, recordId: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Date of Intake
            </label>
            <input
              type="date"
              value={formData.dateOfIntake}
              onChange={(e) =>
                setFormData({ ...formData, dateOfIntake: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        {/* Continue with all form fields... */}
        {/* Full form implementation would continue here */}

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Preferred Contact Method
          </label>
          <div className="flex gap-4">
            {["WhatsApp", "Phone Call", "Email"].map((method) => (
              <label key={method} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.preferredContactMethod.includes(method)}
                  onChange={(e) =>
                    handleArrayChange(
                      "preferredContactMethod",
                      method,
                      e.target.checked,
                    )
                  }
                  className="mr-2"
                />
                {method}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Initial Assessment */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">
          Section 2: Initial Assessment
        </h2>
        <div>
          <label className="block text-sm font-medium mb-2">Summary</label>
          <textarea
            value={formData.summary}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            className="w-full p-2 border rounded h-32"
            required
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Urgency Level
          </label>
          <select
            value={formData.urgencyLevel}
            onChange={(e) =>
              setFormData({ ...formData, urgencyLevel: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Continue with other sections... */}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Record"}
        </button>
      </div>
    </form>
  );
}
