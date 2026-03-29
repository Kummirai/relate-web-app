import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FaEdit,
  FaPrint,
  FaArrowLeft,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaUsers,
  FaExclamationTriangle,
  FaClipboardList,
  FaHandsHelping,
  FaTasks,
  FaFileSignature,
} from "react-icons/fa";
import connectDB from "@/lib/mongodb";
import { FamilyRecord } from "@/lib/models";
import RecordDetailFooter from "@/components/record/RecordDetailFooter";
import mongoose from "mongoose";

async function getRecord(id) {
  try {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const record = await FamilyRecord.findById(id);
    if (!record) return null;
    return JSON.parse(JSON.stringify(record));
  } catch (error) {
    console.error("Error fetching record:", error);
    return null;
  }
}

export default async function RecordDetailPage({ params }) {
  const { id } = await params;
  const record = await getRecord(id);

  if (!record) {
    notFound();
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <section className="pt-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/records"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft />
            <span>Back to Records</span>
          </Link>

          <div className="flex space-x-4">
            <Link
              href={`/records/${id}/edit`}
              className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <FaEdit />
              <span>Edit Record</span>
            </Link>

            <Link
              href={`/print/${id}`}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPrint />
              <span>Print Record</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-800 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold">Record</h1>
                <p className="mt-2 opacity-90">Record ID: {record.recordId}</p>
              </div>
              <div className="text-right">
                <div
                  className={`px-4 py-2 rounded-full inline-block ${
                    record.urgencyLevel === "High"
                      ? "bg-red-500"
                      : record.urgencyLevel === "Medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                >
                  <span className="font-semibold">
                    {record.urgencyLevel} Priority
                  </span>
                </div>
                <p className="mt-2 text-sm opacity-90">
                  Created: {formatDate(record.createdAt)}
                  {record.updatedAt !== record.createdAt && (
                    <span className="block">
                      Updated: {formatDate(record.updatedAt)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Confidentiality Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6">
            <p className="font-bold text-yellow-800">Confidentiality Notice:</p>
            <p className="text-sm text-yellow-700">
              This document contains private and confidential information. It is
              to be used only by authorized personnel involved in the support
              project.
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Section 1: Family & Contact Information */}
            <section>
              <div className="flex items-center mb-4">
                <FaUsers className="text-blue-600 mr-3 text-xl" />
                <h2 className="text-2xl font-bold">
                  Section 1: Family & Contact Information
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Record ID
                    </label>
                    <p className="text-lg font-semibold">{record.recordId}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Date of Intake
                    </label>
                    <p className="text-lg">{formatDate(record.dateOfIntake)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Case Manager
                    </label>
                    <p className="text-lg">{record.caseManager}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Head of Household
                    </label>
                    <p className="text-lg font-semibold">
                      {record.headOfHousehold}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <FaPhone className="text-gray-400" />
                      <label className="text-sm font-medium text-gray-500">
                        Contact Number
                      </label>
                    </div>
                    <p className="text-lg font-mono">{record.contactNumber}</p>
                  </div>

                  {record.alternateContactNumber && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-500 block mb-1">
                        Alternate Contact
                      </label>
                      <p className="text-lg font-mono">
                        {record.alternateContactNumber}
                      </p>
                    </div>
                  )}

                  {record.emailAddress && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <FaEnvelope className="text-gray-400" />
                        <label className="text-sm font-medium text-gray-500">
                          Email Address
                        </label>
                      </div>
                      <p className="text-lg">{record.emailAddress}</p>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <FaHome className="text-gray-400" />
                      <label className="text-sm font-medium text-gray-500">
                        Physical Address
                      </label>
                    </div>
                    <p className="text-lg">{record.physicalAddress}</p>
                  </div>

                  {record.preferredContactMethod?.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="text-sm font-medium text-gray-500 block mb-2">
                        Preferred Contact Method
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {record.preferredContactMethod.map((method) => (
                          <span
                            key={method}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Household Members */}
              {record.householdMembers?.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <FaUsers className="text-blue-600" />
                    <h3 className="text-xl font-semibold">Household Members</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Age
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Relationship
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {record.householdMembers.map((member, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {member.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {member.age}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                {member.relationship}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* Section 2: Initial Assessment & Situation Summary */}
            <section>
              <div className="flex items-center mb-4">
                <FaExclamationTriangle className="text-yellow-600 mr-3 text-xl" />
                <h2 className="text-2xl font-bold">
                  Section 2: Initial Assessment & Situation Summary
                </h2>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 block mb-2">
                    Situation Summary
                  </label>
                  <div className="prose max-w-none">
                    <p className="text-gray-800 whitespace-pre-line">
                      {record.summary}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 block mb-2">
                      Urgency Level
                    </label>
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-full ${
                        record.urgencyLevel === "High"
                          ? "bg-red-100 text-red-800"
                          : record.urgencyLevel === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      <span className="font-semibold">
                        {record.urgencyLevel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {record.urgencyLevel === "High" &&
                        "Requires immediate attention and follow-up"}
                      {record.urgencyLevel === "Medium" &&
                        "Needs attention within 48 hours"}
                      {record.urgencyLevel === "Low" &&
                        "Can be addressed during regular follow-up"}
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 block mb-2">
                      Case Status
                    </label>
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-full ${
                        record.caseClosedDate
                          ? "bg-gray-100 text-gray-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <span className="font-semibold">
                        {record.caseClosedDate ? "Closed" : "Active"}
                      </span>
                    </div>
                    {record.caseClosedDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        Closed on: {formatDate(record.caseClosedDate)}
                      </p>
                    )}
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-500 block mb-2">
                      Last Updated
                    </label>
                    <p className="text-lg">{formatDate(record.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Nature Of Help Required */}
            <section>
              <div className="flex items-center mb-4">
                <FaHandsHelping className="text-purple-600 mr-3 text-xl" />
                <h2 className="text-2xl font-bold">
                  Section 3: Nature Of Help Required
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Immediate Needs */}
                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <h3 className="text-lg font-semibold text-red-800">
                      A) IMMEDIATE / SHORT-TERM SOLUTIONS
                    </h3>
                  </div>

                  {record.immediateNeeds?.length > 0 ? (
                    <ul className="space-y-2">
                      {record.immediateNeeds.map((need, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          <span className="text-gray-800">{need}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">
                      No immediate needs identified
                    </p>
                  )}
                </div>

                {/* Long-term Needs */}
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <h3 className="text-lg font-semibold text-blue-800">
                      B) SUSTAINABLE / LONG-TERM SOLUTIONS
                    </h3>
                  </div>

                  {record.longTermNeeds?.length > 0 ? (
                    <ul className="space-y-2">
                      {record.longTermNeeds.map((need, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-gray-800">{need}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">
                      No long-term needs identified
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 4: Action Log & Follow-Up */}
            <section>
              <div className="flex items-center mb-4">
                <FaTasks className="text-green-600 mr-3 text-xl" />
                <h2 className="text-2xl font-bold">
                  Section 4: Action Log & Follow-Up
                </h2>
              </div>

              {record.actionLog?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action Taken
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          By Whom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Step Required
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {record.actionLog.map((log, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(log.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {log.actionTaken}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {log.byWhom}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {log.nextStep}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {log.dueDate
                                ? formatDate(log.dueDate)
                                : "Not set"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">No action log entries yet</p>
                  <Link
                    href={`/records/${params.id}/edit`}
                    className="inline-block mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Add first action log entry →
                  </Link>
                </div>
              )}
            </section>

            {/* Section 5: Closure Summary (Only if case is closed) */}
            {record.caseClosedDate && (
              <section>
                <div className="flex items-center mb-4">
                  <FaFileSignature className="text-gray-600 mr-3 text-xl" />
                  <h2 className="text-2xl font-bold">
                    Section 5: Closure Summary
                  </h2>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">
                        Case Closed Date
                      </label>
                      <p className="text-lg">
                        {formatDate(record.caseClosedDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">
                        Reason for Closure
                      </label>
                      <p className="text-lg">
                        {record.reasonForClosure || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">
                      Final Outcome Summary
                    </label>
                    <div className="prose max-w-none">
                      <p className="text-gray-800 whitespace-pre-line">
                        {record.finalOutcome ||
                          "No final outcome summary provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4 pt-6 border-t">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {record.householdMembers?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Household Members</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {record.immediateNeeds?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Immediate Needs</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {record.longTermNeeds?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Long-term Needs</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {record.actionLog?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Action Log Entries</p>
              </div>
            </div>
          </div>
        </div>

        <RecordDetailFooter record={record} params={params} />
      </div>
    </section>
  );
}
