/**
 * Seed the "tutors" collection used by the Homework Help feature.
 *
 * Run from the backend directory:
 *
 *   node --env-file=.env.local scripts/seed-tutors.mjs
 *
 * Idempotent: upserts by tutor `id` (t1..t10), so it can be run again safely.
 * Unsplash portrait URLs are stable, resized-square source URLs.
 */
import { setServers } from "node:dns";
import { MongoClient, ServerApiVersion } from "mongodb";
import { createTutor, tutorClubs } from "../lib/tutors.js";

// Some local DNS resolvers refuse SRV queries, which breaks `mongodb+srv`
// URI lookups. Pin public resolvers so seeding works from any network.
setServers(["1.1.1.1", "8.8.8.8"]);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "test";

if (!uri) {
  console.error("MONGODB_URI is not set. Aborting.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

/** YYYY-MM-DD for `offsetDays` from today (keeps booked slots in the future). */
function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function portrait(photoId) {
  return `https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&crop=faces&q=80&auto=format`;
}

// ---------------------------------------------------------------------------
// Seed data (mirrors the frontend mock, plus Unsplash portraits)
// ---------------------------------------------------------------------------

const RAW = [
  {
    id: "t1",
    name: "Thabo Mokoena",
    email: "thabo@relate.app",
    image: portrait("photo-1507003211169-0a1dd7228f2d"),
    subjects: ["Maths", "Science"],
    gradeRanges: ["1–5", "6–8"],
    shortBio:
      "Patient maths and science tutor who makes tricky concepts click with simple, step-by-step explanations.",
    bio: "I have spent the last four years tutoring after school in local community centres. My lessons are built around small wins — every problem broken down into a step a learner can actually follow. I love the 'aha!' moment when a fraction puzzle finally makes sense.",
    rating: 4.9,
    totalSessions: 42,
    responseTime: "2 hours",
    availability: {
      ...EMPTY,
      monday: ["14:00", "14:30", "15:00", "15:30"],
      tuesday: ["14:00", "14:30", "15:00", "15:30"],
      thursday: ["14:00", "14:30", "15:00", "15:30"],
      saturday: ["09:00", "09:30", "10:00"],
    },
    bookedSlots: [
      { date: isoDate(1), time: "14:00" },
      { date: isoDate(1), time: "14:30" },
      { date: isoDate(6), time: "09:00" },
    ],
    verified: true,
  },
  {
    id: "t2",
    name: "Anele Dlamini",
    email: "anele@relate.app",
    image: portrait("photo-1573496359142-b8d87734a5a2"),
    subjects: ["English", "Writing", "Reading"],
    gradeRanges: ["1–5", "6–8"],
    shortBio:
      "English and reading specialist helping children build confidence with words, one book at a time.",
    bio: "Reading aloud is where it all starts. I help learners discover stories they love, then quietly build their comprehension, spelling and creative writing. I tailor every session to the child's reading level and interests.",
    rating: 5.0,
    totalSessions: 61,
    responseTime: "1 hour",
    availability: {
      ...EMPTY,
      monday: ["15:00", "15:30", "16:00"],
      wednesday: ["15:00", "15:30", "16:00", "16:30"],
      friday: ["14:00", "14:30", "15:00"],
    },
    bookedSlots: [{ date: isoDate(2), time: "15:30" }],
    verified: true,
  },
  {
    id: "t3",
    name: "Zanele Khumalo",
    email: "zanele@relate.app",
    image: portrait("photo-1544005313-94ddf0286df2"),
    subjects: ["Maths", "Reading"],
    gradeRanges: ["1–5"],
    shortBio:
      "Gentle, encouraging tutor for our youngest learners — numbers and letters made fun and friendly.",
    bio: "Children under nine learn best when they are having fun. I use games, rhymes and hands-on activities to teach number bonds, counting and early reading. Every session ends with the child feeling proud of what they practised.",
    rating: 4.8,
    totalSessions: 28,
    responseTime: "4 hours",
    availability: {
      ...EMPTY,
      tuesday: ["14:00", "14:30", "15:00"],
      thursday: ["14:00", "14:30", "15:00"],
      saturday: ["09:00", "09:30", "10:00", "10:30"],
    },
    bookedSlots: [],
  },
  {
    id: "t4",
    name: "Lerato Nkosi",
    email: "lerato@relate.app",
    image: portrait("photo-1580489944761-15a19d654956"),
    subjects: ["Science", "Maths", "Technology"],
    gradeRanges: ["6–8", "9–12"],
    shortBio:
      "High-school science and technology mentor who connects schoolwork to the real world.",
    bio: "I tutor Physical Sciences, Life Science and Maths at high-school level. I have a knack for turning abstract formulas into stories and diagrams. Students leave my sessions able to explain the 'why' behind the answer, not just the answer.",
    rating: 4.7,
    totalSessions: 35,
    responseTime: "3 hours",
    availability: {
      ...EMPTY,
      monday: ["16:00", "16:30", "17:00"],
      wednesday: ["16:00", "16:30", "17:00"],
      saturday: ["11:00", "11:30", "12:00"],
    },
    bookedSlots: [{ date: isoDate(3), time: "16:30" }],
    verified: true,
  },
  {
    id: "t5",
    name: "Sipho Mthembu",
    email: "sipho@relate.app",
    image: portrait("photo-1500648767791-00dcc994a43e"),
    subjects: ["Afrikaans", "English"],
    gradeRanges: ["1–5", "6–8"],
    shortBio:
      "Bilingual tutor helping learners master Afrikaans and English with clear, patient practice.",
    bio: "I grew up with both Afrikaans and English at home, so I know the little things that trip learners up between the two languages. I focus on everyday speech first, then writing and comprehension.",
    rating: 4.6,
    totalSessions: 19,
    responseTime: "Same day",
    availability: {
      ...EMPTY,
      tuesday: ["15:00", "15:30", "16:00"],
      thursday: ["15:00", "15:30", "16:00"],
      friday: ["15:00", "15:30"],
    },
    bookedSlots: [],
  },
  {
    id: "t6",
    name: "Naledi van Wyk",
    email: "naledi@relate.app",
    image: portrait("photo-1494790108377-be9c29b29330"),
    subjects: ["Accounting", "Maths"],
    gradeRanges: ["9–12"],
    shortBio:
      "Accounting and maths tutor for matric students — exam technique and plain-English explanations.",
    bio: "Matric accounting and maths intimidates most learners, but it does not have to. I teach exam-ready technique: how to read the question, lay out your work and check your own answers. My students consistently lift their term marks.",
    rating: 4.9,
    totalSessions: 57,
    responseTime: "1 hour",
    availability: {
      ...EMPTY,
      monday: ["17:00", "17:30", "18:00"],
      tuesday: ["17:00", "17:30", "18:00"],
      thursday: ["17:00", "17:30"],
      sunday: ["15:00", "15:30", "16:00"],
    },
    bookedSlots: [{ date: isoDate(1), time: "17:30" }],
    verified: true,
  },
  {
    id: "t7",
    name: "Kagiso Petersen",
    email: "kagiso@relate.app",
    image: portrait("photo-1560250097-0b93528c311a"),
    subjects: ["Maths", "Life Science", "Geography"],
    gradeRanges: ["9–12"],
    shortBio:
      "Friendly matric tutor focused on building solid foundations in maths and the sciences.",
    bio: "I believe every learner can do maths — sometimes they just need a different explanation. I use worked examples and a lot of guided practice. Outside maths, I help with Life Science and Geography theory and mapwork.",
    rating: 4.8,
    totalSessions: 33,
    responseTime: "2 hours",
    availability: {
      ...EMPTY,
      wednesday: ["17:00", "17:30", "18:00"],
      friday: ["16:00", "16:30", "17:00"],
      saturday: ["09:30", "10:00", "10:30"],
    },
    bookedSlots: [{ date: isoDate(5), time: "16:30" }],
  },
  {
    id: "t8",
    name: "Bongani Sithole",
    email: "bongani@relate.app",
    image: portrait("photo-1519085360753-af0119f7cbe7"),
    subjects: ["History", "Geography", "English"],
    gradeRanges: ["9–12"],
    shortBio: "History and Geography mentor who turns essays and source work into marks.",
    bio: "Essay writing, source analysis and mapwork are skills you can learn like any other. I show matric learners how to structure answers that examiners reward, and I keep it lively — history is stories, after all.",
    rating: 4.5,
    totalSessions: 22,
    responseTime: "1 day",
    availability: {
      ...EMPTY,
      tuesday: ["16:00", "16:30", "17:00"],
      thursday: ["16:00", "16:30", "17:00"],
      saturday: ["09:00", "09:30", "10:00"],
    },
    bookedSlots: [],
  },
  {
    id: "t9",
    name: "Yolanda Meiring",
    email: "yolanda@relate.app",
    image: portrait("photo-1534528741775-53994a69daeb"),
    subjects: ["Writing", "English", "Reading"],
    gradeRanges: ["9–12"],
    shortBio:
      "Creative writing coach helping senior learners find their voice and master the essay.",
    bio: "From creative writing to the transactional essay, I help learners organise their thoughts and write with confidence. Reading is the fuel — we build vocabulary through stories, poems and current articles before we write.",
    rating: 4.7,
    totalSessions: 26,
    responseTime: "3 hours",
    availability: {
      ...EMPTY,
      monday: ["16:00", "16:30", "17:00"],
      wednesday: ["16:00", "16:30"],
      sunday: ["14:00", "14:30", "15:00"],
    },
    bookedSlots: [{ date: isoDate(6), time: "15:00" }],
  },
  {
    id: "t10",
    name: "Rethabile Moloi",
    email: "rethabile@relate.app",
    image: portrait("photo-1573497019940-1c28c88b4f3e"),
    subjects: ["Maths", "Accounting"],
    gradeRanges: ["9–12"],
    shortBio:
      "Numbers person through and through — maths and accounting made approachable for finals season.",
    bio: "I have tutored through finals season three years running. My sessions cover past papers, common pitfalls and speed — because in an exam, how fast you work matters almost as much as how well. Bring your calculator and your past papers.",
    rating: 4.9,
    totalSessions: 47,
    responseTime: "2 hours",
    availability: {
      ...EMPTY,
      monday: ["18:00", "18:30", "19:00"],
      tuesday: ["18:00", "18:30"],
      friday: ["17:00", "17:30", "18:00"],
    },
    bookedSlots: [],
    verified: true,
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("tutors");

  await Promise.all([
    col.createIndex({ id: 1 }, { unique: true }),
    col.createIndex({ active: 1, rating: -1 }),
    col.createIndex({ clubs: 1, active: 1, rating: -1 }),
  ]);

  let upserted = 0;
  for (const raw of RAW) {
    const doc = createTutor({
      ...raw,
      bookedSlots: raw.bookedSlots.map((s) => ({ ...s })),
      clubs: tutorClubs(raw.gradeRanges),
    });
    const { createdAt: _created, updatedAt: _updatedAt, ...setDoc } = doc;
    const result = await col.updateOne(
      { id: doc.id },
      { $set: setDoc, $setOnInsert: { createdAt: doc.createdAt } },
      { upsert: true },
    );
    if (result.upsertedCount > 0) upserted += 1;
  }

  const total = await col.countDocuments({});
  console.log(`✅ Seeded tutors: ${RAW.length} upserted (${upserted} new), ${total} in collection.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});