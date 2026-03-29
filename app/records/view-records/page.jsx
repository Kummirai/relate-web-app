import Link from "next/link";
import { FaPlus } from "react-icons/fa";
import connectDB from "../../../lib/mongodb";
import { FamilyRecord } from "../../../lib/models";
import RecordList from "@/components/record/RecordList";

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
        <h1 className="text-3xl font-bold text-gray-800">Records</h1>
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
        <RecordList records={records} />
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total Records: {records.length}
      </div>
    </div>
  );
}
