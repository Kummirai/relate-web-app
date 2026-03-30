import { getDb } from "@/lib/mongodb";
import PrintButton from "@/components/record/PrintButton";

async function getRecordForPrint(id) {
  try {
    const db = await getDb();
    if (!ObjectId.isValid(id)) return null;

    const record = await db
      .collection("familyrecords")
      .findOne({ _id: new ObjectId(id) });

    return record ?? null;
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
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <section>
      <div className="print-container max-w-6xl mx-auto pt-10 pb-20">
        <div className="hidden print:block fixed top-4 right-4">
          <PrintButton />
        </div>

        <div className="bg-white p-8 print:p-0 print:shadow-none shadow-lg rounded-lg">
          <h1 className="text-3xl font-medium mb-8 text-center">
            Family Record
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
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-semibold ${
                        record.status === "Active"
                          ? "text-green-600"
                          : record.status === "Closed"
                            ? "text-gray-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {record.status || "Active"}
                    </span>
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
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p>
                    <strong>Physical Address:</strong>{" "}
                    {record.physicalAddress || "Not specified"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Preferred Contact Method:</strong>{" "}
                    {formatArray(record.preferredContactMethod)}
                  </p>
                </div>
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
                    className={`px-4 py-2 rounded font-semibold inline-block ${
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
                  <h3 className="text-lg font-semibold mb-2">
                    Immediate Needs
                  </h3>
                  <ul className="list-disc pl-5">
                    {record.immediateNeeds &&
                    record.immediateNeeds.length > 0 ? (
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
                <div className="text-center py-4 border border-gray-200 rounded">
                  <p className="text-gray-500">
                    No household members recorded.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    (Head of Household:{" "}
                    {record.headOfHousehold || "Not specified"})
                  </p>
                </div>
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
                      className="border-l-4 border-blue-500 pl-4 py-3 pr-3 bg-gray-50 rounded-r"
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                        <div>
                          <p className="font-semibold text-lg">
                            {log.actionTaken || "Action not specified"}
                          </p>
                          <p className="text-gray-700 mt-1">
                            <strong>By:</strong> {log.byWhom || "Not specified"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-600">
                            {formatDate(log.date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Due:</strong> {formatDate(log.dueDate)}
                          </p>
                        </div>
                      </div>
                      {log.nextStep && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="font-medium">Next Step:</p>
                          <p className="text-gray-700">{log.nextStep}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-gray-200 rounded">
                  <p className="text-gray-500">No actions logged yet.</p>
                </div>
              )}
            </section>

            {record.reasonForClosure ||
            record.finalOutcome ||
            record.caseClosedDate ? (
              <section className="print:break-inside-avoid">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">
                  Section 5: Case Closure
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {record.caseClosedDate && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Case Closed Date
                      </h3>
                      <p className="bg-gray-50 p-4 rounded">
                        {formatDate(record.caseClosedDate)}
                      </p>
                    </div>
                  )}
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
                    <div className="md:col-span-2">
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
            ) : null}

            <div className="print:break-inside-avoid pt-8 border-t mt-8">
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <p>
                    <strong>Document Generated:</strong>
                  </p>
                  <p>
                    {new Date().toLocaleDateString()}{" "}
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Total Household Members:</strong>
                  </p>
                  <p>{record.householdMembers?.length || 0}</p>
                </div>
                <div>
                  <p>
                    <strong>Total Actions Logged:</strong>
                  </p>
                  <p>{record.actionLog?.length || 0}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <p>
                  <strong>Record Created:</strong>{" "}
                  {formatDate(record.createdAt)}
                </p>
                <p>
                  <strong>Last Updated:</strong> {formatDate(record.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 print:hidden">
          <PrintButton />
        </div>
      </div>
    </section>
  );
}
