import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { resolveSession, findUserById } from "@/lib/community-auth";
import {
  VOLUNTEER_OFFICES_COLLECTION,
  OFFICE_APPLICATIONS_COLLECTION,
  serializeApplication,
} from "@/lib/volunteer-offices";
import { notifyAdmins } from "@/lib/inapp-notify";
import { getAdminPushTokens, sendPushNotifications } from "@/lib/push";

/**
 * Apply for an open volunteer office. One pending-or-approved application
 * per member per office. Notifies admins for review.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    const db = await getDb();
    const user = await resolveSession(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in to apply" }, { status: 401 });
    }

    const office = await db
      .collection(VOLUNTEER_OFFICES_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }
    if (office.status !== "open") {
      return NextResponse.json(
        { error: "This office is no longer open for applications." },
        { status: 409 },
      );
    }

    const userDoc = await findUserById(db, user.id);
    const uid = userDoc?.id || userDoc?._id?.toString() || user.id;

    const existing = await db.collection(OFFICE_APPLICATIONS_COLLECTION).findOne({
      officeId: id,
      userId: uid,
      status: { $in: ["pending", "approved"] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already applied for this office." },
        { status: 409 },
      );
    }

    const body = await request.json();

    // Offices may define custom application questions; when they do, each
    // must be answered and the combined answers become the motivation text
    // (so older review screens keep working). Without questions the plain
    // motivation field is required.
    const questions: string[] = Array.isArray(office.applicationQuestions)
      ? office.applicationQuestions.filter((q: unknown): q is string => typeof q === "string" && !!q.trim())
      : [];
    const rawAnswers: any[] = Array.isArray(body.answers) ? body.answers : [];

    let motivation = "";
    let answers: { question: string; answer: string }[] | null = null;

    if (questions.length) {
      answers = [];
      for (const question of questions) {
        const match = rawAnswers.find(
          (a: any) => a && typeof a.question === "string" && a.question.trim() === question.trim(),
        );
        const answer = match && typeof match.answer === "string" ? match.answer.trim() : "";
        if (!answer) {
          return NextResponse.json(
            { error: `Please answer: ${question}` },
            { status: 400 },
          );
        }
        answers.push({ question, answer });
      }
      motivation = answers.map((a) => `${a.question}\n${a.answer}`).join("\n\n");
    } else {
      motivation = typeof body.motivation === "string" ? body.motivation.trim() : "";
    }

    if (motivation.length < 20) {
      return NextResponse.json(
        { error: "Tell them why you're a good fit (at least 20 characters)." },
        { status: 400 },
      );
    }

    const now = new Date();
    const doc = {
      officeId: id,
      officeTitle: office.title,
      userId: uid,
      name: userDoc?.name || user.name || "Unknown",
      email: userDoc?.email || null,
      motivation,
      answers,
      status: "pending",
      reviewNote: null,
      createdAt: now,
      reviewedAt: null,
      reviewedBy: null,
    };
    const result = await db.collection(OFFICE_APPLICATIONS_COLLECTION).insertOne(doc);

    const titleText = "New office application";
    const bodyText = `${doc.name} applied for "${office.title}".`;
    const data = { section: "offices", itemId: id, applicationId: result.insertedId.toString() };
    await Promise.all([
      notifyAdmins(db, { type: "office_applied", title: titleText, body: bodyText, data }, uid),
      sendPushNotifications(await getAdminPushTokens(db, uid), titleText, bodyText, data),
    ]);

    return NextResponse.json(
      { data: serializeApplication({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
  }
}
