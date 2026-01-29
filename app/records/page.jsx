import Link from "next/link";
import { FaPlus, FaEye, FaPrint, FaEdit, FaTrash } from "react-icons/fa";
import connectDB from "../../lib/mongodb";
import { FamilyRecord } from "../../lib/models";

async function getRecords() {
  try {
    await connectDB();
    const records = await FamilyRecord.find({}).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(records));
  } catch (error) {
    console.error("Error fetching records:", error);
    return [];
  }
}

export default async function RecordsPage() {
  const records = await getRecords();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Family Support Records
        </h1>
        <Link
          href="/records/create"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus />
          <span>Create New Record</span>
        </Link>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">No records found.</p>
          <Link
            href="/records/create"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
            <span>Create First Record</span>
          </Link>
        </div>
      ) : (
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
                        ${record.caseClosedDate ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800"}`}
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
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total Records: {records.length}
      </div>
    </div>
  );
}
