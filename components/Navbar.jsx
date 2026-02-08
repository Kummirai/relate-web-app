import Link from "next/link";
import { FaHome, FaFileAlt, FaPlusCircle, FaPrint } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <FaHome className="text-xl" />
            <span className="font-bold text-xl">Relate</span>
          </Link>

          <div className="flex space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-1 hover:text-blue-200"
            >
              <FaHome />
              <span>Home</span>
            </Link>
            <Link
              href="/records"
              className="flex items-center space-x-1 hover:text-blue-200"
            >
              <FaFileAlt />
              <span>Records</span>
            </Link>
            <Link
              href="/records/create"
              className="flex items-center space-x-1 hover:text-blue-200"
            >
              <FaPlusCircle />
              <span>Create</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
