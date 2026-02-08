"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import RecordForm from "@/components/RecordForm";

export default function EditRecordPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/records/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setInitialData(data);
        });
    }
  }, [id]);

  const handleSubmit = async (data) => {
    const response = await fetch(`/api/records/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/records/${id}`);
      router.refresh();
    } else {
      throw new Error("Failed to update record");
    }
  };

  if (!initialData) {
    return (
      <div className="flex justify-center items-center h-screen">
        {/* Example of a simple CSS spinner */}
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <RecordForm
      onSubmit={handleSubmit}
      initialData={initialData}
      isEdit={true}
    />
  );
}
