/**
 * Seasonal appraisal forms and scoring, shared by the assign, submit and
 * performance routes. The field ids here are the wire contract with the
 * mobile form — rename one and existing answers stop scoring.
 */

export type AppraisalType = "individual" | "department";
export type AppraisalStatus = "assigned" | "submitted" | "approved" | "rejected";

export type FieldKind = "number" | "currency" | "percent" | "choice" | "text";

export type AppraisalField = {
  id: string;
  label: string;
  kind: FieldKind;
  hint?: string;
  options?: string[];
  maxLength?: number;
};

export type AppraisalSection = {
  id: string;
  title: string;
  /** Percentage of the final score. 0 marks unscored commentary. */
  weight: number;
  fields: AppraisalField[];
};

export type AppraisalForm = {
  type: AppraisalType;
  title: string;
  sections: AppraisalSection[];
};

export type AppraisalAnswers = Record<string, string | number>;

const YES_NO = ["Yes", "Partly", "No"];
const YES_NO_NA = ["Yes", "Partly", "No", "N/A"];

function number(
  id: string,
  label: string,
  kind: FieldKind = "number",
  hint?: string,
): AppraisalField {
  return { id, label, kind, hint };
}

function choice(id: string, label: string, options: string[]): AppraisalField {
  return { id, label, kind: "choice", options };
}

function text(id: string, label: string): AppraisalField {
  return { id, label, kind: "text", maxLength: 2000 };
}

const INDIVIDUAL: AppraisalForm = {
  type: "individual",
  title: "Seasonal member appraisal",
  sections: [
    {
      id: "attendance",
      title: "Attendance & participation",
      weight: 35,
      fields: [
        number("meetingsAttended", "Board or committee meetings attended"),
        number("meetingsExpected", "Meetings expected", "number", "Usually 3 per season"),
        number("sessionsAttended", "Club sessions or events attended"),
        number("sessionsExpected", "Sessions planned for the season"),
        number("onTimeSessions", "Sessions arrived at on time"),
        choice("absencesNotice", "Absences with 24h notice given", YES_NO),
      ],
    },
    {
      id: "tasks",
      title: "Tasks & delivery",
      weight: 35,
      fields: [
        number("tasksAssigned", "Tasks assigned this season"),
        number("tasksCompleted", "Tasks completed"),
        number("tasksInProgress", "Tasks still in progress"),
        number("tasksOnTime", "Tasks completed by the agreed date"),
      ],
    },
    {
      id: "contribution",
      title: "Contribution to the group",
      weight: 15,
      fields: [
        number("guestsBrought", "Guests or members brought to a session"),
        number("eventDuties", "Event duties worked (setup, logistics, registration)"),
        number("membersMentored", "Members mentored or supported"),
        number("reliefRaised", "Relief or charity requests raised with the board"),
        number("contributionTarget", "Contribution points expected this season", "number", "Defaults to 6"),
      ],
    },
    {
      id: "growth",
      title: "Growth & development",
      weight: 10,
      fields: [
        number("skillsCompleted", "Relate Skills modules completed"),
        number("readingPlans", "Reading plans or programmes completed"),
        number("trainingsAttended", "Training sessions attended"),
        choice("feedbackApplied", "Last season’s feedback acted on", YES_NO),
      ],
    },
    {
      id: "conduct",
      title: "Conduct & safeguarding",
      weight: 5,
      fields: [
        choice("consentComplete", "Consent and registers completed for events attended", YES_NO_NA),
        choice("safeguardingIncidents", "Safeguarding or conduct incidents", ["None", "Logged with details"]),
        choice("representsRespectfully", "Represents Relate respectfully", YES_NO),
      ],
    },
    {
      id: "commentary",
      title: "Season commentary",
      weight: 0,
      fields: [
        text("achievements", "Achievements — what went well, and why?"),
        text("missedTargets", "Targets not met — which ones, and what caused it?"),
        text("concerns", "Concerns — club, programme, safety, or your own participation"),
        text("suggestions", "Suggestions — what could Relate do better for members?"),
        text("improvements", "What will you do differently next season?"),
        text("nextSeasonTarget", "Your target for next season"),
      ],
    },
  ],
};

const DEPARTMENT: AppraisalForm = {
  type: "department",
  title: "Department / club appraisal",
  sections: [
    {
      id: "events",
      title: "Events & attendance",
      weight: 25,
      fields: [
        number("eventsHeld", "Events held this season"),
        number("eventsStandard", "Events hitting the 30-participant standard"),
        number("attendanceRate", "Attendance rate across sessions", "percent"),
        number("transportCostPerParticipant", "Transport cost per participant", "currency"),
        number("transportCostTarget", "Transport cost target per participant", "currency"),
      ],
    },
    {
      id: "pricing",
      title: "Pricing & surplus",
      weight: 25,
      fields: [
        number("ticketPrice", "Ticket price per participant", "currency"),
        number("costPerParticipant", "Cost per participant", "currency"),
        number("surplusTarget", "Net surplus target per participant", "currency", "Defaults to R50"),
      ],
    },
    {
      id: "coffer",
      title: "Coffer contribution",
      weight: 20,
      fields: [
        number("revenueTarget", "Department revenue target for the season", "currency"),
        number("collected", "Amount collected", "currency"),
        text("streams", "Streams it came from (Founders’ Fund, Events, Relate Wear, Sportswear, Digital Services)"),
      ],
    },
    {
      id: "tooling",
      title: "Zero-license & tooling",
      weight: 10,
      fields: [number("licensingSpend", "Licensing spend this season", "currency", "R0 is full marks")],
    },
    {
      id: "relief",
      title: "Relief logistics",
      weight: 10,
      fields: [
        number("reliefRequests", "Charity support requests brought by members"),
        number("reliefVerified", "Requests verified and submitted to the board"),
        number("reliefCompleted", "Requests completed after release"),
      ],
    },
    {
      id: "team",
      title: "Team & compliance",
      weight: 10,
      fields: [
        number("facilitatorsActive", "Facilitators or volunteers active"),
        number("facilitatorsNeeded", "Facilitators or volunteers needed"),
        choice("registersComplete", "Registers and consent forms complete", YES_NO_NA),
        choice("safeguardingLogged", "Safeguarding incidents logged correctly", ["Yes", "No", "None"]),
        choice("handoverCurrent", "Handover documents current", YES_NO),
      ],
    },
    {
      id: "commentary",
      title: "Season commentary",
      weight: 0,
      fields: [
        text("wins", "Operational wins and why they worked"),
        text("missedTargets", "Targets missed, with cause"),
        text("concerns", "Concerns the board should know about"),
        text("suggestions", "Suggestions and improvements for the organisation"),
        text("actions", "Action steps agreed for next season"),
        text("leadComments", "Lead evaluator’s comments"),
      ],
    },
  ],
};

export const APPRAISAL_FORMS: Record<AppraisalType, AppraisalForm> = {
  individual: INDIVIDUAL,
  department: DEPARTMENT,
};

export const APPRAISAL_TYPES: AppraisalType[] = ["individual", "department"];

export const STATUS_LABELS: Record<AppraisalStatus, string> = {
  assigned: "Awaiting form",
  submitted: "Submitted — in review",
  approved: "Approved",
  rejected: "Sent back with notes",
};

export function isAppraisalType(value: unknown): value is AppraisalType {
  return value === "individual" || value === "department";
}

/** Keeps only schema fields, clamps numbers, caps text. */
export function sanitizeAnswers(
  type: AppraisalType,
  raw: unknown,
): AppraisalAnswers {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const answers: AppraisalAnswers = {};
  for (const section of APPRAISAL_FORMS[type].sections) {
    for (const field of section.fields) {
      const value = input[field.id];
      if (field.kind === "text") {
        const str = typeof value === "string" ? value.trim() : "";
        answers[field.id] = str.slice(0, field.maxLength ?? 2000);
        continue;
      }
      if (field.kind === "choice") {
        const str = typeof value === "string" ? value.trim() : "";
        answers[field.id] = field.options?.includes(str) ? str : "";
        continue;
      }
      const n = typeof value === "string" ? Number(value) : value;
      if (typeof n === "number" && Number.isFinite(n) && n >= 0) {
        const rounded = Math.round(n * 100) / 100;
        answers[field.id] = field.kind === "percent" ? Math.min(100, rounded) : rounded;
      } else {
        answers[field.id] = 0;
      }
    }
  }
  return answers;
}

function n(answers: AppraisalAnswers, key: string): number {
  const value = answers[key];
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num) && num > 0 ? num : 0;
}

function s(answers: AppraisalAnswers, key: string): string {
  const value = answers[key];
  return typeof value === "string" ? value : "";
}

/** Yes = 100, Partly = 50, No = 0. N/A / None count as met. */
function choicePct(answers: AppraisalAnswers, key: string): number {
  const value = s(answers, key);
  if (value === "Yes" || value === "N/A" || value === "None") return 100;
  if (value === "Partly") return 50;
  return 0;
}

function ratio(part: number, whole: number): number {
  if (whole <= 0) return part > 0 ? 1 : 0;
  return Math.min(1, part / whole);
}

function weighted(score: number, weight: number): number {
  return Math.max(0, Math.min(weight, score * weight));
}

type SectionScore = { id: string; title: string; weight: number; score: number };

function scoreIndividual(answers: AppraisalAnswers): SectionScore[] {
  const meetings = weighted(
    ratio(n(answers, "meetingsAttended"), n(answers, "meetingsExpected")),
    15,
  );
  const sessions = weighted(
    ratio(n(answers, "sessionsAttended"), n(answers, "sessionsExpected")),
    10,
  );
  const punctuality = weighted(
    ratio(n(answers, "onTimeSessions"), n(answers, "sessionsAttended")),
    5,
  );
  const notice = weighted(choicePct(answers, "absencesNotice") / 100, 5);
  const attendance = meetings + sessions + punctuality + notice;

  const assigned = n(answers, "tasksAssigned");
  const completed = n(answers, "tasksCompleted");
  const inProgress = n(answers, "tasksInProgress");
  const delivery = weighted(
    assigned > 0 ? Math.min(1, (completed + inProgress * 0.5) / assigned) : 0,
    25,
  );
  const timeliness = weighted(ratio(n(answers, "tasksOnTime"), completed), 10);
  const tasks = delivery + timeliness;

  const target = n(answers, "contributionTarget") || 6;
  const points =
    n(answers, "guestsBrought") +
    n(answers, "eventDuties") +
    n(answers, "membersMentored") +
    n(answers, "reliefRaised");
  const contribution = weighted(ratio(points, target), 15);

  const growthItems =
    (n(answers, "skillsCompleted") +
      n(answers, "readingPlans") +
      n(answers, "trainingsAttended")) /
    3;
  const growth =
    weighted(Math.min(1, growthItems), 7) +
    weighted(choicePct(answers, "feedbackApplied") / 100, 3);

  const conduct =
    (choicePct(answers, "consentComplete") +
      choicePct(answers, "safeguardingIncidents") +
      choicePct(answers, "representsRespectfully")) /
    3 /
    100;
  const conductScore = weighted(conduct, 5);

  return [
    { id: "attendance", title: "Attendance & participation", weight: 35, score: attendance },
    { id: "tasks", title: "Tasks & delivery", weight: 35, score: tasks },
    { id: "contribution", title: "Contribution to the group", weight: 15, score: contribution },
    { id: "growth", title: "Growth & development", weight: 10, score: growth },
    { id: "conduct", title: "Conduct & safeguarding", weight: 5, score: conductScore },
  ];
}

function scoreDepartment(answers: AppraisalAnswers): SectionScore[] {
  const held = n(answers, "eventsHeld");
  const standard = weighted(ratio(n(answers, "eventsStandard"), held), 10);
  const attendance = weighted(n(answers, "attendanceRate") / 100, 10);
  const target = n(answers, "transportCostTarget");
  const perHead = n(answers, "transportCostPerParticipant");
  const transport = weighted(
    target > 0 && perHead > 0 ? Math.min(1, target / perHead) : perHead > 0 ? 0 : 1,
    5,
  );
  const events = standard + attendance + transport;

  const surplus = Math.max(0, n(answers, "ticketPrice") - n(answers, "costPerParticipant"));
  const surplusTarget = n(answers, "surplusTarget") || 50;
  const pricing = weighted(ratio(surplus, surplusTarget), 25);

  const coffer = weighted(
    ratio(n(answers, "collected"), n(answers, "revenueTarget")),
    20,
  );

  const tooling = n(answers, "licensingSpend") <= 0 ? 10 : 0;

  const requests = n(answers, "reliefRequests");
  const relief =
    weighted(ratio(n(answers, "reliefVerified"), requests), 5) +
    weighted(ratio(n(answers, "reliefCompleted"), requests), 5);

  const teamRatio = weighted(
    ratio(n(answers, "facilitatorsActive"), n(answers, "facilitatorsNeeded")),
    4,
  );
  const compliance =
    (choicePct(answers, "registersComplete") +
      choicePct(answers, "safeguardingLogged") +
      choicePct(answers, "handoverCurrent")) /
    3 /
    100;
  const team = teamRatio + weighted(compliance, 6);

  return [
    { id: "events", title: "Events & attendance", weight: 25, score: events },
    { id: "pricing", title: "Pricing & surplus", weight: 25, score: pricing },
    { id: "coffer", title: "Coffer contribution", weight: 20, score: coffer },
    { id: "tooling", title: "Zero-license & tooling", weight: 10, score: tooling },
    { id: "relief", title: "Relief logistics", weight: 10, score: relief },
    { id: "team", title: "Team & compliance", weight: 10, score: team },
  ];
}

export type AppraisalScore = {
  score: number;
  band: string;
  sections: SectionScore[];
};

export function bandFor(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Meets";
  if (score >= 40) return "Developing";
  return "Intervention";
}

/** Weighted season score from the submitted answers. */
export function scoreAppraisal(
  type: AppraisalType,
  answers: AppraisalAnswers,
): AppraisalScore {
  const sections = type === "department" ? scoreDepartment(answers) : scoreIndividual(answers);
  const total = sections.reduce((sum, section) => sum + section.score, 0);
  const score = Math.round(Math.min(100, Math.max(0, total)) * 10) / 10;
  return {
    score,
    band: bandFor(score),
    sections: sections.map((section) => ({
      ...section,
      score: Math.round(section.score * 10) / 10,
    })),
  };
}

const SEASONS = ["Autumn", "Winter", "Spring", "Summer"] as const;
export type SeasonName = (typeof SEASONS)[number];

/** Calendar quarter → the season it closes: Jan–Mar Autumn … Oct–Dec Summer. */
export function currentSeason(date = new Date()): { name: SeasonName; year: number } {
  return {
    name: SEASONS[Math.floor(date.getMonth() / 3)],
    year: date.getFullYear(),
  };
}

export { SEASONS };
