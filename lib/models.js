import mongoose from "mongoose";

const FamilyRecordSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    },
    dateOfIntake: { type: Date, required: true },
    caseManager: { type: String, required: true },
    headOfHousehold: { type: String, required: true },
    contactNumber: { type: String, required: true },
    alternateContactNumber: { type: String },
    emailAddress: { type: String },
    physicalAddress: { type: String, required: true },
    preferredContactMethod: {
      type: [String],
      enum: ["WhatsApp", "Phone Call", "Email"],
      default: [],
    },
    householdMembers: [
      {
        name: String,
        age: Number,
        relationship: String,
      },
    ],
    summary: { type: String, required: true },
    urgencyLevel: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
      default: "Medium",
    },
    immediateNeeds: [
      {
        type: String,
        enum: [
          "Food Assistance",
          "Shelter",
          "Utility Bills",
          "Clothing",
          "Medical/Hygiene",
          "Child Tuition",
          "Other",
        ],
      },
    ],
    longTermNeeds: [
      {
        type: String,
        enum: [
          "Employment",
          "Education",
          "Financial Literacy",
          "Housing",
          "Healthcare",
          "Social Services",
          "Other",
        ],
      },
    ],
    actionLog: [
      {
        date: { type: Date, default: Date.now },
        actionTaken: String,
        byWhom: String,
        nextStep: String,
        dueDate: Date,
      },
    ],
    caseClosedDate: { type: Date },
    reasonForClosure: { type: String },
    finalOutcome: { type: String },
    status: {
      type: String,
      enum: ["Active", "Closed", "Draft"],
      default: "Active",
    },
  },
  { timestamps: true },
);

// FIX: Use proper function syntax for middleware
FamilyRecordSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Automatically set status to Closed if caseClosedDate exists
  if (this.caseClosedDate) {
    this.status = "Closed";
  }

  // Call next() to continue the save operation
  next();
});

export const FamilyRecord =
  mongoose.models.FamilyRecord ||
  mongoose.model("FamilyRecord", FamilyRecordSchema);
