import connectDB from "../../../lib/mongodb";
import { FamilyRecord } from "../../../lib/models";
import PrintButton from "@/components/PrintButton";

async function getRecordForPrint(id) {
  try {
    await connectDB();
    const record = await FamilyRecord.findById(id);
    if (!record) return null;
    return record.toJSON();
  } catch (error) {
    console.error("Error fetching record for print:", error);
    return null;
  }
}

export default async function PrintPage({ params }) {
  const { id } = await params;
  const record = await getRecordForPrint(id);

  if (!record) {
    return <div>Record not found</div>;
  }

  const formatArray = (arr) => {
    if (!arr || arr.length === 0) return "None";
    return arr.join(", ");
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="print-container">
      <div className="hidden print:block fixed top-4 right-4">
        <PrintButton />
      </div>

      <div className="bg-white p-8 print:p-0 print:shadow-none shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Family Care Record
        </h1>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 print:break-inside-avoid">
          <p className="font-bold">Confidentiality Notice:</p>
          <p className="text-sm">
            This document contains private and confidential information. It is
            to be used only by authorized personnel involved in the support
            project.
          </p>
        </div>

        {/* Render all record information in print-friendly format */}
        <div className="space-y-8">
          <section className="print:break-inside-avoid">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">
              Section 1: Family & Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Record ID:</strong>{" "}
                  {record.recordId || "Not specified"}
                </p>
                <p>
                  <strong>Date of Intake:</strong>{" "}
                  {formatDate(record.dateOfIntake)}
                </p>
                <p>
                  <strong>Case Manager:</strong>{" "}
                  {record.caseManager || "Not specified"}
                </p>
                <p>
                  <strong>Physical Address:</strong>{" "}
                  {record.physicalAddress || "Not specified"}
                </p>
              </div>
              <div>
                <p>
                  <strong>Head of Household:</strong>{" "}
                  {record.headOfHousehold || "Not specified"}
                </p>
                <p>
                  <strong>Contact Number:</strong>{" "}
                  {record.contactNumber || "Not specified"}
                </p>
                <p>
                  <strong>Alternate Contact:</strong>{" "}
                  {record.alternateContactNumber || "Not specified"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {record.emailAddress || "Not specified"}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p>
                <strong>Preferred Contact Method:</strong>{" "}
                {formatArray(record.preferredContactMethod)}
              </p>
            </div>
          </section>

          <section className="print:break-inside-avoid">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">
              Section 2: Needs Assessment
            </h2>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Case Summary</h3>
              <p className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                {record.summary || "No summary provided."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Urgency Level</h3>
                <div
                  className={`px-4 py-2 rounded font-semibold ${
                    record.urgencyLevel === "High"
                      ? "bg-red-100 text-red-800"
                      : record.urgencyLevel === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {record.urgencyLevel || "Medium"}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Immediate Needs</h3>
                <ul className="list-disc pl-5">
                  {record.immediateNeeds && record.immediateNeeds.length > 0 ? (
                    record.immediateNeeds.map((need, index) => (
                      <li key={index} className="mb-1">
                        {need}
                      </li>
                    ))
                  ) : (
                    <li>No immediate needs identified</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Long-term Needs</h3>
              <ul className="list-disc pl-5">
                {record.longTermNeeds && record.longTermNeeds.length > 0 ? (
                  record.longTermNeeds.map((need, index) => (
                    <li key={index} className="mb-1">
                      {need}
                    </li>
                  ))
                ) : (
                  <li>No long-term needs identified</li>
                )}
              </ul>
            </div>
          </section>

          <section className="print:break-inside-avoid">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">
              Section 3: Household Members
            </h2>
            {record.householdMembers && record.householdMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Name
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Age
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Relationship
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Special Needs
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.householdMembers.map((member, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">
                          {member.name || "Not specified"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {member.age || "Not specified"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {member.relationship || "Not specified"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {member.specialNeeds || "None"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {member.notes || "None"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No household members recorded.</p>
            )}
          </section>

          <section className="print:break-inside-avoid">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">
              Section 4: Action Log
            </h2>
            {record.actionLog && record.actionLog.length > 0 ? (
              <div className="space-y-4">
                {record.actionLog.map((log, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold">
                        {log.action || "Action not specified"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(log.date)}
                      </p>
                    </div>
                    {log.notes && (
                      <p className="mt-1 text-gray-700">{log.notes}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Status:</strong> {log.status || "Not specified"} |
                      <strong> Assigned to:</strong>{" "}
                      {log.assignedTo || "Not assigned"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No actions logged.</p>
            )}
          </section>

          {(record.reasonForClosure || record.finalOutcome) && (
            <section className="print:break-inside-avoid">
              <h2 className="text-2xl font-bold mb-4 border-b pb-2">
                Section 5: Case Closure
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {record.reasonForClosure && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Reason for Closure
                    </h3>
                    <p className="bg-gray-50 p-4 rounded">
                      {record.reasonForClosure}
                    </p>
                  </div>
                )}
                {record.finalOutcome && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Final Outcome
                    </h3>
                    <p className="bg-gray-50 p-4 rounded">
                      {record.finalOutcome}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="print:break-inside-avoid pt-8 border-t">
            <p className="text-sm text-gray-600">
              <strong>Document Generated:</strong>{" "}
              {new Date().toLocaleDateString()}{" "}
              {new Date().toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Total Household Members:</strong>{" "}
              {record.householdMembers?.length || 0}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Total Actions Logged:</strong>{" "}
              {record.actionLog?.length || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
