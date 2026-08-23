"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaUser,
  FaHome,
  FaPhone,
  FaEnvelope,
  FaUsers,
  FaExclamationTriangle,
  FaTasks,
  FaFileSignature,
  FaCalendar,
  FaTrash,
  FaCheck,
} from "react-icons/fa";

export default function RecordForm({ onSubmit, initialData, isEdit = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [showClosureSection, setShowClosureSection] = useState(
    !!initialData.caseClosedDate,
  );

  useEffect(() => {
    setFormData(initialData);
    setShowClosureSection(!!initialData.caseClosedDate);
  }, [initialData]);

  const immediateNeedsOptions = [
    "Food Assistance",
    "Shelter",
    "Utility Bills",
    "Clothing",
    "Medical/Hygiene",
    "Child Tuition",
    "Other",
  ];

  const longTermNeedsOptions = [
    "Employment",
    "Education",
    "Financial Literacy",
    "Housing",
    "Healthcare",
    "Social Services",
    "Other",
  ];

  // Household Members Functions
  const addHouseholdMember = () => {
    setFormData((prev) => ({
      ...prev,
      householdMembers: [
        ...(prev.householdMembers || []),
        { name: "", age: "", relationship: "" },
      ],
    }));
  };

  const removeHouseholdMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      householdMembers: prev.householdMembers.filter((_, i) => i !== index),
    }));
  };

  const updateHouseholdMember = (index, field, value) => {
    const newMembers = [...(formData.householdMembers || [])];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData((prev) => ({ ...prev, householdMembers: newMembers }));
  };

  // Action Log Functions
  const addActionLogEntry = () => {
    setFormData((prev) => ({
      ...prev,
      actionLog: [
        ...(prev.actionLog || []),
        {
          date: new Date().toISOString().split("T")[0],
          actionTaken: "",
          byWhom: "",
          nextStep: "",
          dueDate: "",
        },
      ],
    }));
  };

  const removeActionLogEntry = (index) => {
    setFormData((prev) => ({
      ...prev,
      actionLog: prev.actionLog.filter((_, i) => i !== index),
    }));
  };

  const updateActionLogEntry = (index, field, value) => {
    const newEntries = [...(formData.actionLog || [])];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setFormData((prev) => ({ ...prev, actionLog: newEntries }));
  };

  // Form Handlers
  const handleCheckboxChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] || []), value]
        : prev[field].filter((item) => item !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSubmit = {
      ...formData,
      householdMembers: formData.householdMembers?.filter(
        (m) => m.name?.trim() !== "",
      ),
      actionLog: formData.actionLog?.map((entry) => ({
        ...entry,
        date: entry.date
          ? new Date(entry.date).toISOString()
          : new Date().toISOString(),
      })),
      caseClosedDate:
        showClosureSection && formData.reasonForClosure?.trim()
          ? formData.caseClosedDate || new Date().toISOString()
          : null,
    };

    try {
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pt-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-zinc-800">
            {isEdit ? "Edit Family Record" : "Create New Family Record"}
          </h1>
          <p className="text-zinc-600 mt-2">
            {isEdit
              ? "Update the information for this family support record."
              : "Fill out all required information for the family support record."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Family & Contact Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FaUser className="text-blue-600 mr-2" />
              <h2 className="text-2xl font-medium">
                Section 1: Family & Contact Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Record ID *
                </label>
                <input
                  type="text"
                  value={formData.recordId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, recordId: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                  readOnly={isEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Date of Intake *
                </label>
                <input
                  type="date"
                  value={(formData.dateOfIntake || "").split("T")[0]}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfIntake: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Case Manager / Primary Contact *
                </label>
                <input
                  type="text"
                  value={formData.caseManager || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, caseManager: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                  placeholder="Enter case manager name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Head of Household Name *
                </label>
                <input
                  type="text"
                  value={formData.headOfHousehold || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      headOfHousehold: e.target.value,
                    })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                  placeholder="Enter head of household name"
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <FaPhone className="text-zinc-400 mr-2" />
                  <label className="block text-sm font-medium">
                    Contact Number *
                  </label>
                </div>
                <input
                  type="tel"
                  value={formData.contactNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                  placeholder="Enter primary contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Alternate Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.alternateContactNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alternateContactNumber: e.target.value,
                    })
                  }
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter alternate contact number"
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <FaEnvelope className="text-zinc-400 mr-2" />
                  <label className="block text-sm font-medium">
                    Email Address
                  </label>
                </div>
                <input
                  type="email"
                  value={formData.emailAddress || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, emailAddress: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <FaHome className="text-zinc-400 mr-2" />
                  <label className="block text-sm font-medium">
                    Physical Address *
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.physicalAddress || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      physicalAddress: e.target.value,
                    })
                  }
                  className="w-full p-3 border rounded-lg"
                  required
                  placeholder="Enter full physical address"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">
                Preferred Contact Method
              </label>
              <div className="flex flex-wrap gap-4">
                {["WhatsApp", "Phone Call", "Email"].map((method) => (
                  <label
                    key={method}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.preferredContactMethod?.includes(
                        method,
                      )}
                      onChange={(e) =>
                        handleCheckboxChange(
                          "preferredContactMethod",
                          method,
                          e.target.checked,
                        )
                      }
                      className="mr-2 h-5 w-5 text-blue-600 rounded"
                    />
                    <span className="text-zinc-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center mb-4">
                <FaUsers className="text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold">Household Members</h3>
              </div>

              {(formData.householdMembers || []).map((member, index) => (
                <div
                  key={index}
                  className="grid md:grid-cols-3 gap-4 mb-4 p-4 border rounded-lg"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) =>
                        updateHouseholdMember(index, "name", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      value={member.age}
                      onChange={(e) =>
                        updateHouseholdMember(index, "age", e.target.value)
                      }
                      className="w-full p-2 border rounded"
                      placeholder="Age"
                      min="0"
                      max="120"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex-1 mr-2">
                      <label className="block text-sm font-medium mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={member.relationship}
                        onChange={(e) =>
                          updateHouseholdMember(
                            index,
                            "relationship",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 border rounded"
                        placeholder="e.g., Spouse, Child, etc."
                      />
                    </div>
                    {(formData.householdMembers.length > 1 ||
                      (isEdit && formData.householdMembers.length > 0)) && (
                      <button
                        type="button"
                        onClick={() => removeHouseholdMember(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addHouseholdMember}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <FaPlus />
                <span>Add Household Member</span>
              </button>
            </div>
          </div>

          {/* Section 2: Initial Assessment */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-yellow-600 mr-2" />
              <h2 className="text-2xl font-bold">
                Section 2: Initial Assessment & Situation Summary
              </h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Summary *
              </label>
              <textarea
                value={formData.summary || ""}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                className="w-full p-3 border rounded-lg h-40"
                required
                placeholder="Provide a detailed summary of the family's situation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Urgency Level *
              </label>
              <div className="flex space-x-6">
                {["High", "Medium", "Low"].map((level) => (
                  <label
                    key={level}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={level}
                      checked={formData.urgencyLevel === level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          urgencyLevel: e.target.value,
                        })
                      }
                      className="mr-2 h-5 w-5 text-blue-600"
                    />
                    <span
                      className={`px-3 py-1 rounded-full ${
                        level === "High"
                          ? "bg-red-100 text-red-800"
                          : level === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Nature Of Help Required */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">
              Section 3: Nature Of Help Required
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-600">
                  A) IMMEDIATE / SHORT-TERM SOLUTIONS
                </h3>
                <div className="space-y-3">
                  {immediateNeedsOptions.map((need) => (
                    <label
                      key={need}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.immediateNeeds?.includes(need)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            "immediateNeeds",
                            need,
                            e.target.checked,
                          )
                        }
                        className="mr-3 h-5 w-5 text-red-600 rounded"
                      />
                      <span className="text-zinc-700">{need}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-600">
                  B) SUSTAINABLE / LONG-TERM SOLUTIONS
                </h3>
                <div className="space-y-3">
                  {longTermNeedsOptions.map((need) => (
                    <label
                      key={need}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.longTermNeeds?.includes(need)}
                        onChange={(e) =>
                          handleCheckboxChange(
                            "longTermNeeds",
                            need,
                            e.target.checked,
                          )
                        }
                        className="mr-3 h-5 w-5 text-blue-600 rounded"
                      />
                      <span className="text-zinc-700">{need}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Action Log & Follow-Up */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <FaTasks className="text-green-600 mr-2" />
              <h2 className="text-2xl font-bold">
                Section 4: Action Log & Follow-Up
              </h2>
            </div>

            <div className="mb-4">
              <p className="text-zinc-600 text-sm mb-4">
                Record all actions taken and follow-up steps for this case.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Action Taken
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      By Whom
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Next Step Required
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200">
                  {(formData.actionLog || []).map((entry, index) => (
                    <tr key={index} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaCalendar className="text-zinc-400 mr-2" />
                          <input
                            type="date"
                            value={(entry.date || "").split("T")[0]}
                            onChange={(e) =>
                              updateActionLogEntry(
                                index,
                                "date",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 border rounded text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={entry.actionTaken}
                          onChange={(e) =>
                            updateActionLogEntry(
                              index,
                              "actionTaken",
                              e.target.value,
                            )
                          }
                          className="w-full p-2 border rounded text-sm"
                          placeholder="Describe action taken..."
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={entry.byWhom}
                          onChange={(e) =>
                            updateActionLogEntry(
                              index,
                              "byWhom",
                              e.target.value,
                            )
                          }
                          className="w-full p-2 border rounded text-sm"
                          placeholder="Person responsible"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={entry.nextStep}
                          onChange={(e) =>
                            updateActionLogEntry(
                              index,
                              "nextStep",
                              e.target.value,
                            )
                          }
                          className="w-full p-2 border rounded text-sm"
                          placeholder="Next required step..."
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaCalendar className="text-zinc-400 mr-2" />
                          <input
                            type="date"
                            value={(entry.dueDate || "").split("T")[0]}
                            onChange={(e) =>
                              updateActionLogEntry(
                                index,
                                "dueDate",
                                e.target.value,
                              )
                            }
                            className="w-full p-2 border rounded text-sm"
                            min={(entry.date || "").split("T")[0]}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          onClick={() => removeActionLogEntry(index)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove entry"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={addActionLogEntry}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <FaPlus />
                <span>Add Action Log Entry</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Tip:</strong> Record all actions and follow-up steps for
                this case.
              </p>
            </div>
          </div>

          {/* Section 5: Closure Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FaFileSignature className="text-zinc-600 mr-2" />
                <h2 className="text-2xl font-bold">
                  Section 5: Closure Summary
                </h2>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClosureSection}
                  onChange={(e) => setShowClosureSection(e.target.checked)}
                  className="mr-2 h-5 w-5 text-blue-600 rounded"
                />
                <span className="text-zinc-700">Mark case as closed</span>
              </label>
            </div>

            {showClosureSection ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason for Closure *
                  </label>
                  <textarea
                    value={formData.reasonForClosure || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reasonForClosure: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg h-32"
                    required={showClosureSection}
                    placeholder="Explain why this case is being closed..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Final Outcome Summary
                  </label>
                  <textarea
                    value={formData.finalOutcome || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, finalOutcome: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg h-40"
                    placeholder="Summarize the final outcome and achievements of this case..."
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 bg-zinc-50 rounded-lg text-center">
                <p className="text-zinc-600 mb-2">Case is currently active</p>
                <p className="text-sm text-zinc-500">
                  Check the box above to close this case and add closure
                  details.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEdit ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <FaPlus />
                  <span>
                    {isEdit
                      ? showClosureSection
                        ? "Update & Close Case"
                        : "Update Record"
                      : showClosureSection
                        ? "Create & Close Case"
                        : "Create Record"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> All fields marked with * are required. Please
            ensure all information is accurate before submitting.
          </p>
        </div>
      </div>
    </section>
  );
}
