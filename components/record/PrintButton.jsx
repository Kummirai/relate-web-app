"use client";

import { FaPrint } from "react-icons/fa";

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
    >
      <FaPrint />
      <span>Print Record</span>
    </button>
  );
}
