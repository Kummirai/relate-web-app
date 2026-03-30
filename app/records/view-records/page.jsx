import Link from "next/link";
import { FaPlus } from "react-icons/fa";
import { getDb } from "@/lib/mongodb";
import RecordList from "@/components/record/RecordList";

async function getRecords() {
  try {
    const db = await getDb();
    const records = await db
      .collection("familyrecords")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    console.log(records);

    return records;
  } catch (error) {
    console.error("Error fetching records:", error);
    return [];
  }
}

export default async function RecordsPage() {
  const records = await getRecords();

  return (
    <section className="min-h-[calc(100vh-92px)]">
      <div className="max-w-6xl mx-auto pt-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium text-gray-800">Records</h1>
          <Link
            href="/records/create"
            className="flex items-center space-x-2 bg-zinc-950 text-white px-4 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm"
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
    </section>
  );
}
