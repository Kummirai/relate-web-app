"use client";

import Link from "next/link";
import { FaPrint, FaFileSignature } from "react-icons/fa";

export default function RecordDetailFooter({ record, params }) {
  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-8 flex justify-between items-center">
      <div className="text-sm text-gray-500">
        <p>Record last modified: {formatDateTime(record.updatedAt)}</p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FaPrint />
          <span>Print Preview</span>
        </button>

        {!record.caseClosedDate && (
          <Link
            href={`/records/${params.id}/edit?close=true`}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <FaFileSignature />
            <span>Close Case</span>
          </Link>
        )}
      </div>
    </div>
  );
}
