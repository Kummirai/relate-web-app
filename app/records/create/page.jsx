"use client";

import { useRouter } from "next/navigation";
import RecordForm from "@/components/RecordForm";

export default function CreateRecordPage() {
  const router = useRouter();

  const handleSubmit = async (data) => {
    const response = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push("/records");
      router.refresh();
    } else {
      throw new Error("Failed to create record");
    }
  };

  const initialData = {
    recordId: `REC-${Date.now()}`,
    dateOfIntake: new Date().toISOString().split("T")[0],
    caseManager: "",
    headOfHousehold: "",
    contactNumber: "",
    alternateContactNumber: "",
    emailAddress: "",
    physicalAddress: "",
    preferredContactMethod: [],
    summary: "",
    urgencyLevel: "Medium",
    immediateNeeds: [],
    longTermNeeds: [],
    actionLog: [],
    householdMembers: [],
    reasonForClosure: "",
    finalOutcome: "",
  };

  return <RecordForm onSubmit={handleSubmit} initialData={initialData} />;
}
