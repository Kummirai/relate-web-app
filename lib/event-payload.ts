import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { parseFee } from "@/lib/fees";
import { fetchParticipants } from "@/lib/community-auth";
import { stripInternal } from "@/lib/card-view";

/**
 * Single source of truth for an event's full wire shape. The list batches the
 * participant, bookmark and registration lookups across every event and calls
 * toEventRow per row; the by-id route fetches them for one event. Both must
 * produce identical fields, because the same object feeds the detail modal,
 * the registration modal and the edit form.
 */
export type EventRowContext = {
  userId: string | null;
  participants: Map<string, any>;
  bookmarkedIds: Set<string>;
  myReg?: any;
};

export function toEventRow(e: any, ctx: EventRowContext) {
  const { userId, participants, bookmarkedIds, myReg } = ctx;
  const rsvpUsers = (e.rsvpUserIds || [])
    .map((id: string) => participants.get(id))
    .filter(Boolean);
  const fee = parseFee(e.fee);
  const totalDue = fee.amount * (myReg?.bringingPartner ? 2 : 1);
  const amountPaid = myReg?.amountPaid || 0;
  const pendingAmount = myReg?.pendingAmount || 0;
  const remaining = Math.max(0, totalDue - amountPaid);
  const hasPaid = totalDue === 0 || remaining <= 0;
  const hasRsvpd = userId ? (e.rsvpUserIds || []).includes(userId) : false;
  const mine = !!userId && hasRsvpd;
  return {
    _id: e._id,
    title: e.title,
    date: e.date,
    time: e.time,
    dateTo: e.dateTo || undefined,
    timeTo: e.timeTo || undefined,
    agenda: Array.isArray(e.agenda) ? e.agenda : [],
    notes: e.notes || "",
    location: e.location,
    description: e.description,
    fee: e.fee || "Free",
    feeAmount: fee.amount,
    feeSymbol: fee.symbol,
    clubSlug: e.clubSlug || undefined,
    imageUrl: e.imageUrl || null,
    author: e.author || "",
    category: e.category || undefined,
    eyebrow: e.eyebrow || undefined,
    titleAccent: e.titleAccent || undefined,
    host: e.host || undefined,
    capacity: e.capacity || undefined,
    tags: Array.isArray(e.tags) ? e.tags : [],
    details: Array.isArray(e.details) ? e.details : [],
    userId: e.userId || null,
    attending: e.attending || 0,
    hasRsvpd,
    hasPaid,
    amountPaid: mine ? amountPaid : 0,
    pendingAmount: mine ? pendingAmount : 0,
    remaining: mine ? remaining : totalDue,
    totalDue,
    myPartner: mine ? !!myReg?.bringingPartner : false,
    isBookmarked: userId ? bookmarkedIds.has(e._id.toString()) : false,
    rsvpUsers,
    createdAt: e.createdAt,
    // Raw ids for the list cache to re-derive per-viewer flags from.
    _rsvpUserIds: e.rsvpUserIds || [],
    _ownerUserId: e.userId || null,
    _ownerAuthor: e.author || null,
  };
}

/** One event with every join the full list row carries, minus cache keys. */
export async function loadEventRow(
  db: Db,
  id: string,
  userId: string | null,
) {
  const event = await db
    .collection("community_events")
    .findOne({ _id: new ObjectId(id) });
  if (!event) return null;

  const [participants, bookmark, myReg] = await Promise.all([
    fetchParticipants(db, event.rsvpUserIds || []),
    userId
      ? db.collection("user_bookmarks").findOne({
          userId,
          section: "events",
          itemId: id,
        })
      : null,
    userId
      ? db
          .collection("event_registrations")
          .findOne({ eventId: new ObjectId(id), userId })
      : null,
  ]);

  return stripInternal(
    toEventRow(event, {
      userId,
      participants,
      bookmarkedIds: new Set(bookmark ? [id] : []),
      myReg: userId ? myReg : undefined,
    }),
  );
}