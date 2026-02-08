"use client";

import Link from "next/link";
import { FaEye, FaPrint, FaEdit, FaTrash } from "react-icons/fa";

export default function RecordList({ records }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Record ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Head of Household
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intake Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Urgency Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {record.recordId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {record.headOfHousehold}
                  </div>
                  <div className="text-sm text-gray-500">
                    {record.contactNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(record.dateOfIntake).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${
                      record.urgencyLevel === "High"
                        ? "bg-red-100 text-red-800"
                        : record.urgencyLevel === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {record.urgencyLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${
                      record.caseClosedDate
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {record.caseClosedDate ? "Closed" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link
                      href={`/records/${record._id}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <FaEye />
                    </Link>
                    <Link
                      href={`/print/${record._id}`}
                      className="text-green-600 hover:text-green-900"
                      title="Print"
                    >
                      <FaPrint />
                    </Link>
                    <Link
                      href={`/records/${record._id}/edit`}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </Link>
                    <button
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                      onClick={async () => {
                        if (
                          confirm(
                            "Are you sure you want to delete this record?",
                          )
                        ) {
                          await fetch(`/api/records/${record._id}`, {
                            method: "DELETE",
                          });
                          window.location.reload();
                        }
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
