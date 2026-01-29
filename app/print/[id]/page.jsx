import connectDB from "../../../lib/mongodb";
import { FamilyRecord } from "../../../lib/models";
import PrintButton from "@/components/PrintButton";

export default async function PrintPage({ params }) {
  await connectDB();
  const record = await FamilyRecord.findById(params.id);

  if (!record) {
    return <div>Record not found</div>;
  }

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
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">
              Section 1: Family & Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>Record ID:</strong> {record.recordId}
                </p>
                <p>
                  <strong>Date of Intake:</strong>{" "}
                  {new Date(record.dateOfIntake).toLocaleDateString()}
                </p>
                <p>
                  <strong>Case Manager:</strong> {record.caseManager}
                </p>
              </div>
              <div>
                <p>
                  <strong>Head of Household:</strong> {record.headOfHousehold}
                </p>
                <p>
                  <strong>Contact Number:</strong> {record.contactNumber}
                </p>
                <p>
                  <strong>Email:</strong> {record.emailAddress}
                </p>
              </div>
            </div>
          </section>

          {/* Continue with other sections... */}
        </div>
      </div>

      <div className="mt-8 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
