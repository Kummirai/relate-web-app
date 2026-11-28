import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import { cleanText, toNonNegNumber } from "./financial-reports";

/**
 * Relate School Kit — one ledger for stationery stock and learner allocations.
 *
 * Every event is a movement row: opening stock, a restock (with what it cost),
 * an issue to a learner (written when an allocation is recorded, so stock
 * deducts itself) or a stock-take adjustment. Stock, usage, learners served
 * and renewal windows are all derived from this ledger, so the numbers can
 * never drift apart.
 */

export const KIT_COLLECTION = "school_kit_movements";
export const KIT_CHECKS = "school_kit_checks";
export const LEARNER_COLLECTION = "club_join_applications";

export type KitItemKey = "book" | "pencil" | "pen";
export type KitMovementKind = "opening" | "restock" | "issue" | "adjustment";

export const KIT_ITEM_KEYS: KitItemKey[] = ["book", "pencil", "pen"];

export const KIT_ITEMS: Record<
  KitItemKey,
  {
    name: string;
    short: string;
    unit: string;
    cadence: { minWeeks: number; maxWeeks: number };
    /** Clubs the item is intended for; empty means every learner. */
    clubs: string[];
  }
> = {
  book: {
    name: "32-page A4 exercise book",
    short: "Exercise books",
    unit: "books",
    cadence: { minWeeks: 4, maxWeeks: 8 },
    clubs: [],
  },
  pencil: {
    name: "HB pencil",
    short: "HB pencils",
    unit: "pencils",
    cadence: { minWeeks: 3, maxWeeks: 4 },
    clubs: ["sprout", "sprout-kids", "sprout-tweens"],
  },
  pen: {
    name: "Ballpoint pen",
    short: "Ballpoint pens",
    unit: "pens",
    cadence: { minWeeks: 4, maxWeeks: 6 },
    clubs: ["sprout", "sprout-teens"],
  },
};

/** Clubs whose members receive a School Kit. */
export const LEARNER_CLUBS = [
  "sprout",
  "sprout-kids",
  "sprout-tweens",
  "sprout-teens",
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type KitMovement = {
  _id: string;
  kind: KitMovementKind;
  item: KitItemKey;
  qty: number;
  date: string;
  amount: number;
  unitCost: number | null;
  memberId: string | null;
  memberName: string | null;
  clubSlug: string | null;
  swapVerified: boolean;
  note: string;
};

type RawMovement = {
  _id: any;
  kind: KitMovementKind;
  item: KitItemKey;
  qty: number;
  date: Date;
  amount?: number;
  unitCost?: number | null;
  memberId?: string | null;
  memberName?: string | null;
  clubSlug?: string | null;
  swapVerified?: boolean;
  note?: string;
  season?: number;
};

export function isKitItem(value: unknown): value is KitItemKey {
  return typeof value === "string" && (KIT_ITEM_KEYS as string[]).includes(value);
}

export function isMovementKind(value: unknown): value is KitMovementKind {
  return (
    value === "opening" ||
    value === "restock" ||
    value === "issue" ||
    value === "adjustment"
  );
}

/** Parse "July 2026" / "Jul 2026" into an inclusive start and exclusive end. */
export function parsePeriodRange(
  period: string,
): { start: Date; end: Date; label: string } | null {
  const m = period
    .trim()
    .match(
      /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})$/i,
    );
  if (!m) return null;
  const monthIndex = MONTHS.findIndex(
    (abbr) => abbr.toLowerCase() === m[1].slice(0, 3).toLowerCase(),
  );
  if (monthIndex < 0) return null;
  const year = parseInt(m[2], 10);
  return {
    start: new Date(year, monthIndex, 1),
    end: new Date(year, monthIndex + 1, 1),
    label: `${FULL_MONTHS[monthIndex]} ${year}`,
  };
}

export function parseSeason(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 2000 && n <= 2100) return Math.trunc(n);
  return new Date().getFullYear();
}

function seasonRange(season: number): { start: Date; end: Date } {
  return { start: new Date(season, 0, 1), end: new Date(season + 1, 0, 1) };
}

export function toMovement(doc: RawMovement): KitMovement {
  return {
    _id: doc._id?.toString?.() ?? "",
    kind: doc.kind,
    item: doc.item,
    qty: Number(doc.qty) || 0,
    date: doc.date instanceof Date ? doc.date.toISOString() : String(doc.date ?? ""),
    amount: Number(doc.amount) || 0,
    unitCost: doc.unitCost ?? null,
    memberId: doc.memberId ?? null,
    memberName: doc.memberName ?? null,
    clubSlug: doc.clubSlug ?? null,
    swapVerified: doc.swapVerified === true,
    note: doc.note ?? "",
  };
}

export type ItemStock = {
  opening: number;
  received: number;
  issued: number;
  adjusted: number;
  stock: number;
};

function emptyStock(): ItemStock {
  return { opening: 0, received: 0, issued: 0, adjusted: 0, stock: 0 };
}

export function computeStock(
  movements: RawMovement[],
): Record<KitItemKey, ItemStock> {
  const stock = {
    book: emptyStock(),
    pencil: emptyStock(),
    pen: emptyStock(),
  } as Record<KitItemKey, ItemStock>;

  for (const mv of movements) {
    if (!isKitItem(mv.item)) continue;
    const qty = Number(mv.qty) || 0;
    const row = stock[mv.item];
    if (mv.kind === "opening") row.opening += qty;
    else if (mv.kind === "restock") row.received += qty;
    else if (mv.kind === "issue") row.issued += qty;
    else if (mv.kind === "adjustment") row.adjusted += qty;
  }

  for (const key of KIT_ITEM_KEYS) {
    const row = stock[key];
    row.stock = row.opening + row.received + row.adjusted - row.issued;
  }
  return stock;
}

export async function loadSeasonMovements(
  season: number,
): Promise<RawMovement[]> {
  const db = await getDb();
  const { start, end } = seasonRange(season);
  return (await db
    .collection(KIT_COLLECTION)
    .find({ date: { $gte: start, $lt: end } })
    .sort({ date: 1, createdAt: 1 })
    .toArray()) as unknown as RawMovement[];
}

/** Newest-first ledger rows for the Stock tab. */
export async function listMovements(
  season: number,
  limit = 80,
): Promise<KitMovement[]> {
  const db = await getDb();
  const { start, end } = seasonRange(season);
  const rows = (await db
    .collection(KIT_COLLECTION)
    .find({ date: { $gte: start, $lt: end } })
    .sort({ date: -1, createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 300))
    .toArray()) as unknown as RawMovement[];
  return rows.map(toMovement);
}

export type DueState = "none" | "ok" | "due" | "overdue";

export type LearnerKitItem = {
  qty: number;
  lastIssued: string | null;
  dueFrom: string | null;
  dueTo: string | null;
  state: DueState;
  renewedWith: boolean;
};

export type LearnerKit = {
  id: string;
  name: string;
  clubSlug: string;
  clubName: string;
  age: number | null;
  userId: string | null;
  items: Record<KitItemKey, LearnerKitItem>;
  nextDue: string | null;
  dueState: DueState;
  examCheckedAt: string | null;
};

function dueStateFor(
  lastIssued: Date | null,
  item: KitItemKey,
  now: number,
): { dueFrom: string | null; dueTo: string | null; state: DueState } {
  if (!lastIssued) {
    return { dueFrom: null, dueTo: null, state: "none" };
  }
  const { minWeeks, maxWeeks } = KIT_ITEMS[item].cadence;
  const from = lastIssued.getTime() + minWeeks * WEEK_MS;
  const to = lastIssued.getTime() + maxWeeks * WEEK_MS;
  const state: DueState = now > to ? "overdue" : now >= from ? "due" : "ok";
  return {
    dueFrom: new Date(from).toISOString(),
    dueTo: new Date(to).toISOString(),
    state,
  };
}

const DUE_ORDER: Record<DueState, number> = {
  overdue: 0,
  due: 1,
  ok: 2,
  none: 3,
};

/**
 * Build each learner's current kit from their issue movements. Unissued items
 * of a learner's club still appear, so the detail screen can show "not yet
 * issued" rather than hiding the row.
 */
export function buildLearnerKit(
  member: {
    _id: any;
    name?: string;
    clubSlug?: string;
    clubName?: string;
    age?: number | string;
    userId?: string;
  },
  movements: RawMovement[],
  examCheckedAt: Date | null,
  now = Date.now(),
): LearnerKit {
  const items = {} as Record<KitItemKey, LearnerKitItem>;
  for (const key of KIT_ITEM_KEYS) {
    const issues = movements
      .filter((m) => m.kind === "issue" && m.item === key)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    const last = issues[0];
    const due = dueStateFor(last ? last.date : null, key, now);
    items[key] = {
      qty: issues.reduce((sum, m) => sum + (Number(m.qty) || 0), 0),
      lastIssued: last ? last.date.toISOString() : null,
      dueFrom: due.dueFrom,
      dueTo: due.dueTo,
      state: due.state,
      renewedWith: issues.some((m) => m.swapVerified === true),
    };
  }

  // The learner's headline state is the most pressing item they hold.
  const held = KIT_ITEM_KEYS.filter((k) => items[k].lastIssued);
  const ranked = held.sort(
    (a, b) => DUE_ORDER[items[a].state] - DUE_ORDER[items[b].state],
  );
  const headline = ranked[0];
  const nextDue =
    ranked
      .map((k) => items[k].dueTo)
      .filter((v): v is string => !!v)
      .sort()[0] ?? null;

  const ageNum =
    typeof member.age === "number"
      ? member.age
      : Number(member.age) || null;

  return {
    id: member._id?.toString?.() ?? "",
    name: member.name || "Learner",
    clubSlug: member.clubSlug || "",
    clubName: member.clubName || member.clubSlug || "",
    age: ageNum,
    userId: member.userId || null,
    items,
    nextDue,
    dueState: headline ? items[headline].state : "none",
    examCheckedAt: examCheckedAt ? examCheckedAt.toISOString() : null,
  };
}

export type KitOverview = {
  season: number;
  seasons: number[];
  asOf: string;
  items: Record<KitItemKey, ItemStock>;
  totals: {
    learnersServed: number;
    dueSoon: number;
    overdue: number;
    spend: number;
  };
  months: {
    key: string;
    label: string;
    issued: Record<KitItemKey, number>;
    restocked: Record<KitItemKey, number>;
    spend: number;
  }[];
  clubs: { clubSlug: string; clubName: string; issued: number; learners: number }[];
  dueList: {
    memberId: string;
    name: string;
    clubSlug: string;
    item: KitItemKey;
    dueState: DueState;
    dueTo: string | null;
  }[];
};

export async function buildOverview(season: number): Promise<KitOverview> {
  const db = await getDb();
  const movements = await loadSeasonMovements(season);
  const items = computeStock(movements);

  const seasonIssues = movements.filter(
    (m) => m.kind === "issue" && m.memberId,
  );
  const served = new Set<string>();
  const issuedByClub = new Map<string, number>();
  for (const mv of seasonIssues) {
    if (mv.memberId) served.add(mv.memberId);
    if (mv.clubSlug) {
      issuedByClub.set(
        mv.clubSlug,
        (issuedByClub.get(mv.clubSlug) ?? 0) + (Number(mv.qty) || 0),
      );
    }
  }

  const spend = movements
    .filter((m) => m.kind === "restock" || m.kind === "opening")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  // Per-learner record, so we know each learner's home club.
  const memberIds = [...served];
  const learners = memberIds.length
    ? await db
        .collection(LEARNER_COLLECTION)
        .find({ _id: { $in: memberIds.filter(ObjectId.isValid).map((id) => new ObjectId(id)) } })
        .project({ name: 1, clubSlug: 1 })
        .toArray()
    : [];
  const learnerById = new Map<string, any>(
    learners.map((l: any) => [l._id.toString(), l]),
  );

  // Distinct learners reached, per club.
  const learnersByClub = new Map<string, Set<string>>();
  for (const mv of seasonIssues) {
    if (!mv.memberId) continue;
    const club = learnerById.get(mv.memberId)?.clubSlug || mv.clubSlug;
    if (!club) continue;
    const set = learnersByClub.get(club) ?? new Set<string>();
    set.add(mv.memberId);
    learnersByClub.set(club, set);
  }

  // League table of clubs, most issued first.
  const clubNames = new Map<string, string>();
  const clubSlugs = [...new Set([...issuedByClub.keys(), ...learnersByClub.keys()])];
  if (clubSlugs.length) {
    const clubDocs = await db
      .collection("clubs")
      .find({ slug: { $in: clubSlugs } })
      .project({ slug: 1, name: 1 })
      .toArray();
    for (const c of clubDocs) clubNames.set(c.slug, c.name || c.slug);
  }
  const clubs = clubSlugs
    .map((clubSlug) => ({
      clubSlug,
      clubName: clubNames.get(clubSlug) ?? clubSlug,
      issued: issuedByClub.get(clubSlug) ?? 0,
      learners: learnersByClub.get(clubSlug)?.size ?? 0,
    }))
    .sort((a, b) => b.issued - a.issued);

  const now = Date.now();
  const dueList: KitOverview["dueList"] = [];
  let dueSoon = 0;
  let overdue = 0;

  const byMember = new Map<string, RawMovement[]>();
  for (const mv of seasonIssues) {
    if (!mv.memberId) continue;
    const list = byMember.get(mv.memberId) ?? [];
    list.push(mv);
    byMember.set(mv.memberId, list);
  }

  for (const [memberId, rows] of byMember.entries()) {
    const learner = learnerById.get(memberId);
    for (const item of KIT_ITEM_KEYS) {
      const issues = rows.filter((m) => m.item === item);
      const last = issues.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      if (!last) continue;
      const due = dueStateFor(last.date, item, now);
      if (due.state === "overdue") overdue += 1;
      else if (due.state === "due") dueSoon += 1;
      if (due.state === "due" || due.state === "overdue") {
        dueList.push({
          memberId,
          name: learner?.name ?? last.memberName ?? "Learner",
          clubSlug: learner?.clubSlug ?? last.clubSlug ?? "",
          item,
          dueState: due.state,
          dueTo: due.dueTo,
        });
      }
    }
  }
  dueList.sort((a, b) =>
    a.dueState === b.dueState
      ? (a.dueTo ?? "").localeCompare(b.dueTo ?? "")
      : DUE_ORDER[a.dueState] - DUE_ORDER[b.dueState],
  );

  // Six-month issued/restocked series ending with the current month.
  const months: KitOverview["months"] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const row: KitOverview["months"][number] = {
      key,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      issued: { book: 0, pencil: 0, pen: 0 },
      restocked: { book: 0, pencil: 0, pen: 0 },
      spend: 0,
    };
    for (const mv of movements) {
      const t = mv.date.getTime();
      if (t < start || t >= end || !isKitItem(mv.item)) continue;
      if (mv.kind === "issue") row.issued[mv.item] += Number(mv.qty) || 0;
      if (mv.kind === "restock") {
        row.restocked[mv.item] += Number(mv.qty) || 0;
        row.spend += Number(mv.amount) || 0;
      }
      if (mv.kind === "opening") row.spend += Number(mv.amount) || 0;
    }
    months.push(row);
  }

  const seasons = new Set<number>([season]);
  const distinct = await db
    .collection(KIT_COLLECTION)
    .aggregate([
      { $group: { _id: { $year: "$date" } } },
      { $sort: { _id: -1 } },
    ])
    .toArray();
  for (const row of distinct) {
    if (typeof row._id === "number") seasons.add(row._id);
  }

  return {
    season,
    seasons: [...seasons].sort((a, b) => b - a).slice(0, 6),
    asOf: new Date().toISOString(),
    items,
    totals: {
      learnersServed: served.size,
      dueSoon,
      overdue,
      spend: Math.round(spend * 100) / 100,
    },
    months,
    clubs,
    dueList: dueList.slice(0, 12),
  };
}

export async function searchLearners(
  query: string,
  season: number,
): Promise<LearnerKit[]> {
  const db = await getDb();
  const filter: any = {
    status: "active",
    clubSlug: { $in: LEARNER_CLUBS },
  };
  const q = query.trim();
  if (q.length >= 2) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = new RegExp(escaped, "i");
  }

  const members = await db
    .collection(LEARNER_COLLECTION)
    .find(filter)
    .sort({ name: 1 })
    .limit(300)
    .toArray();

  if (!members.length) return [];

  const memberIds = members.map((m) => m._id.toString());
  const movements = (await db
    .collection(KIT_COLLECTION)
    .find({ kind: "issue", memberId: { $in: memberIds } })
    .toArray()) as unknown as RawMovement[];

  const checks = await db
    .collection(KIT_CHECKS)
    .find({ season, memberId: { $in: memberIds } })
    .toArray();
  const checkByMember = new Map<string, Date>(
    checks.map((c: any) => [c.memberId, c.checkedAt] as [string, Date]),
  );

  const byMember = new Map<string, RawMovement[]>();
  for (const mv of movements) {
    if (!mv.memberId) continue;
    const list = byMember.get(mv.memberId) ?? [];
    list.push(mv);
    byMember.set(mv.memberId, list);
  }

  const now = Date.now();
  const kits = members.map((m) =>
    buildLearnerKit(
      m,
      byMember.get(m._id.toString()) ?? [],
      checkByMember.get(m._id.toString()) ?? null,
      now,
    ),
  );

  kits.sort((a, b) =>
    a.dueState === b.dueState
      ? a.name.localeCompare(b.name)
      : DUE_ORDER[a.dueState] - DUE_ORDER[b.dueState],
  );
  return kits;
}

export async function learnerDetail(
  memberId: string,
  season: number,
): Promise<{ learner: LearnerKit; history: KitMovement[] } | null> {
  if (!ObjectId.isValid(memberId)) return null;
  const db = await getDb();
  const member = await db
    .collection(LEARNER_COLLECTION)
    .findOne({ _id: new ObjectId(memberId) });
  if (!member) return null;

  const movements = (await db
    .collection(KIT_COLLECTION)
    .find({ memberId, kind: "issue" })
    .sort({ date: -1 })
    .toArray()) as unknown as RawMovement[];

  const check = await db
    .collection(KIT_CHECKS)
    .findOne({ season, memberId });

  return {
    learner: buildLearnerKit(member, movements, check?.checkedAt ?? null),
    history: movements.map(toMovement),
  };
}

function normaliseItems(
  input: unknown,
): { item: KitItemKey; qty: number }[] | { error: string } {
  if (!Array.isArray(input) || input.length === 0) {
    return { error: "Choose at least one item to allocate." };
  }
  const rows: { item: KitItemKey; qty: number }[] = [];
  for (const raw of input) {
    const item = (raw as any)?.item;
    const qty = Number((raw as any)?.qty);
    if (!isKitItem(item)) return { error: "Unknown item in the allocation." };
    if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
      return { error: "Each quantity must be a whole number from 1 to 500." };
    }
    rows.push({ item, qty });
  }
  return rows;
}

/** Date the movement: explicit ISO date from the form, else today. */
export function movementDate(value: unknown): Date {
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export async function createAllocation(input: {
  memberIds: string[];
  items: unknown;
  swapVerified?: boolean;
  date?: unknown;
  note?: unknown;
  adminName: string;
  adminId: string;
}): Promise<{
  ok: boolean;
  error?: string;
  status?: number;
  issued?: number;
  stock?: Record<KitItemKey, ItemStock>;
}> {
  const items = normaliseItems(input.items);
  if ("error" in items) return { ok: false, status: 400, error: items.error };

  const memberIds = Array.isArray(input.memberIds)
    ? input.memberIds.filter((id) => ObjectId.isValid(String(id)))
    : [];
  if (!memberIds.length) {
    return { ok: false, status: 400, error: "Choose at least one learner." };
  }

  const db = await getDb();
  const members = await db
    .collection(LEARNER_COLLECTION)
    .find({ _id: { $in: memberIds.map((id) => new ObjectId(id)) } })
    .toArray();
  if (!members.length) {
    return { ok: false, status: 404, error: "No matching learners found." };
  }

  const date = movementDate(input.date);
  const year = date.getFullYear();
  const stock = computeStock(await loadSeasonMovements(year));

  const requested: Record<KitItemKey, number> = { book: 0, pencil: 0, pen: 0 };
  for (const row of items) requested[row.item] += row.qty * members.length;

  for (const key of KIT_ITEM_KEYS) {
    if (requested[key] > stock[key].stock) {
      return {
        ok: false,
        status: 409,
        error: `Only ${stock[key].stock} ${KIT_ITEMS[key].unit} left in stock — record a restock first.`,
      };
    }
  }

  const note = cleanText(input.note, 200);
  const docs = [];
  for (const member of members) {
    for (const row of items) {
      docs.push({
        kind: "issue" as const,
        item: row.item,
        qty: row.qty,
        date,
        amount: 0,
        unitCost: null,
        memberId: member._id.toString(),
        memberName: member.name || "Learner",
        clubSlug: member.clubSlug || null,
        swapVerified: input.swapVerified === true,
        note,
        season: year,
        createdBy: input.adminId,
        createdByName: input.adminName,
        createdAt: new Date(),
      });
    }
  }

  if (docs.length) await db.collection(KIT_COLLECTION).insertMany(docs);
  return {
    ok: true,
    issued: docs.length,
    stock: computeStock(await loadSeasonMovements(year)),
  };
}

export async function createMovement(input: {
  kind: unknown;
  item: unknown;
  qty: unknown;
  amount?: unknown;
  unitCost?: unknown;
  date?: unknown;
  note?: unknown;
  adminName: string;
  adminId: string;
}): Promise<{
  ok: boolean;
  error?: string;
  status?: number;
  stock?: Record<KitItemKey, ItemStock>;
}> {
  if (!isMovementKind(input.kind) || input.kind === "issue") {
    return { ok: false, status: 400, error: "Unknown stock movement." };
  }
  if (!isKitItem(input.item)) {
    return { ok: false, status: 400, error: "Unknown stationery item." };
  }

  const qty = Number(input.qty);
  const signedQty = input.kind === "adjustment" ? qty : Math.abs(qty);
  if (
    !Number.isInteger(signedQty) ||
    signedQty === 0 ||
    Math.abs(signedQty) > 5000
  ) {
    return {
      ok: false,
      status: 400,
      error:
        input.kind === "adjustment"
          ? "Enter a whole-number correction, e.g. -3 or 5."
          : "Quantity must be a whole number from 1 to 5000.",
    };
  }

  const amount = Math.max(0, toNonNegNumber(input.amount));
  const date = movementDate(input.date);
  const year = date.getFullYear();

  const db = await getDb();

  // An adjustment may not take stock below zero.
  if (signedQty < 0) {
    const current = computeStock(await loadSeasonMovements(year));
    if (current[input.item as KitItemKey].stock + signedQty < 0) {
      return {
        ok: false,
        status: 409,
        error: "That correction is larger than the stock on hand.",
      };
    }
  }

  const unitCost =
    (input.kind === "restock" || input.kind === "opening") &&
    amount > 0 &&
    Math.abs(signedQty) > 0
      ? Math.round((amount / Math.abs(signedQty)) * 100) / 100
      : null;

  await db.collection(KIT_COLLECTION).insertOne({
    kind: input.kind,
    item: input.item,
    qty: signedQty,
    date,
    amount,
    unitCost,
    memberId: null,
    memberName: null,
    clubSlug: null,
    swapVerified: false,
    note: cleanText(input.note, 200),
    season: year,
    createdBy: input.adminId,
    createdByName: input.adminName,
    createdAt: new Date(),
  });

  return { ok: true, stock: computeStock(await loadSeasonMovements(year)) };
}

type LedgerResult = {
  ok: boolean;
  error?: string;
  status?: number;
  stock?: Record<KitItemKey, ItemStock>;
  movements?: KitMovement[];
  season?: number;
};

/** Replays the ledger minus the edited row; refuses any negative stock. */
async function stockGuard(
  seasons: number[],
  removedId: string,
  replacement: RawMovement | null,
): Promise<string | null> {
  for (const season of new Set(seasons)) {
    const rows = (await loadSeasonMovements(season)).filter(
      (m) => String(m._id) !== removedId,
    );
    if (replacement) {
      const date =
        replacement.date instanceof Date
          ? replacement.date
          : new Date(replacement.date);
      if (!isNaN(date.getTime()) && date.getFullYear() === season) {
        rows.push(replacement);
      }
    }
    const stock = computeStock(rows);
    for (const key of KIT_ITEM_KEYS) {
      if (stock[key].stock < 0) {
        return `${KIT_ITEMS[key].short}: that would leave ${stock[key].stock} in stock. Record an adjustment or restock first.`;
      }
    }
  }
  return null;
}

function movementSeason(doc: RawMovement): number {
  const date = doc.date instanceof Date ? doc.date : new Date(doc.date);
  return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
}

export async function updateMovement(input: {
  id: string;
  item: unknown;
  qty: unknown;
  amount?: unknown;
  date?: unknown;
  note?: unknown;
  adminName: string;
  adminId: string;
}): Promise<LedgerResult> {
  if (!ObjectId.isValid(input.id)) {
    return { ok: false, status: 400, error: "Unknown movement." };
  }
  if (!isKitItem(input.item)) {
    return { ok: false, status: 400, error: "Unknown stationery item." };
  }

  const db = await getDb();
  const _id = new ObjectId(input.id);
  const doc = (await db.collection(KIT_COLLECTION).findOne({ _id })) as
    | RawMovement
    | null;
  if (!doc) {
    return { ok: false, status: 404, error: "That movement no longer exists." };
  }

  const qty = Number(input.qty);
  const signedQty = doc.kind === "adjustment" ? qty : Math.abs(qty);
  if (
    !Number.isInteger(signedQty) ||
    signedQty === 0 ||
    Math.abs(signedQty) > 5000
  ) {
    return {
      ok: false,
      status: 400,
      error:
        doc.kind === "adjustment"
          ? "Enter a whole-number correction, e.g. -3 or 5."
          : "Quantity must be a whole number from 1 to 5000.",
    };
  }

  const priced = doc.kind === "restock" || doc.kind === "opening";
  const amount = priced ? Math.max(0, toNonNegNumber(input.amount)) : 0;
  const date = movementDate(input.date);
  const year = date.getFullYear();
  const unitCost =
    priced && amount > 0 && signedQty > 0
      ? Math.round((amount / signedQty) * 100) / 100
      : null;

  const next: RawMovement = {
    ...doc,
    item: input.item,
    qty: signedQty,
    amount,
    unitCost,
    date,
    season: year,
    note: cleanText(input.note, 200),
  };

  const guard = await stockGuard([movementSeason(doc), year], input.id, next);
  if (guard) return { ok: false, status: 409, error: guard };

  await db.collection(KIT_COLLECTION).updateOne(
    { _id },
    {
      $set: {
        item: next.item,
        qty: next.qty,
        amount: next.amount,
        unitCost: next.unitCost,
        date: next.date,
        season: next.season,
        note: next.note,
        updatedBy: input.adminId,
        updatedByName: input.adminName,
        updatedAt: new Date(),
      },
    },
  );

  return {
    ok: true,
    stock: computeStock(await loadSeasonMovements(year)),
    movements: await listMovements(year),
    season: year,
  };
}

export async function deleteMovement(input: {
  id: string;
}): Promise<LedgerResult> {
  if (!ObjectId.isValid(input.id)) {
    return { ok: false, status: 400, error: "Unknown movement." };
  }

  const db = await getDb();
  const _id = new ObjectId(input.id);
  const doc = (await db.collection(KIT_COLLECTION).findOne({ _id })) as
    | RawMovement
    | null;
  if (!doc) {
    return { ok: false, status: 404, error: "That movement no longer exists." };
  }

  const year = movementSeason(doc);
  const guard = await stockGuard([year], input.id, null);
  if (guard) return { ok: false, status: 409, error: guard };

  await db.collection(KIT_COLLECTION).deleteOne({ _id });
  return {
    ok: true,
    stock: computeStock(await loadSeasonMovements(year)),
    movements: await listMovements(year),
    season: year,
  };
}

export async function setExamCheck(input: {
  memberId: string;
  checked: boolean;
  season: number;
  adminName: string;
  adminId: string;
}): Promise<{ ok: boolean }> {
  if (!ObjectId.isValid(input.memberId)) return { ok: false };
  const db = await getDb();
  if (input.checked) {
    await db.collection(KIT_CHECKS).updateOne(
      { memberId: input.memberId, season: input.season },
      {
        $set: {
          memberId: input.memberId,
          season: input.season,
          checkedAt: new Date(),
          checkedBy: input.adminId,
          checkedByName: input.adminName,
        },
      },
      { upsert: true },
    );
  } else {
    await db
      .collection(KIT_CHECKS)
      .deleteOne({ memberId: input.memberId, season: input.season });
  }
  return { ok: true };
}

export type SchoolKitStatement = {
  period: string | null;
  opening: Record<KitItemKey, number>;
  received: Record<KitItemKey, number>;
  issued: Record<KitItemKey, number>;
  closing: Record<KitItemKey, number>;
  spend: number;
  learners: number;
};

/**
 * Monthly stock statement for the financial report: opening at the start of
 * the month, in / out during it, closing at the end, spend and learners.
 */
export async function buildStatement(
  period: string,
): Promise<SchoolKitStatement | null> {
  const range = parsePeriodRange(period);
  if (!range) return null;

  const db = await getDb();
  const movements = (await db
    .collection(KIT_COLLECTION)
    .find({ date: { $lt: range.end } })
    .toArray()) as unknown as RawMovement[];

  const zero = (): Record<KitItemKey, number> => ({ book: 0, pencil: 0, pen: 0 });
  const opening = zero();
  const received = zero();
  const issued = zero();
  const adjusted = zero();
  let spend = 0;
  const learners = new Set<string>();

  for (const mv of movements) {
    if (!isKitItem(mv.item)) continue;
    const qty = Number(mv.qty) || 0;
    const inMonth =
      mv.date.getTime() >= range.start.getTime() &&
      mv.date.getTime() < range.end.getTime();
    if (!inMonth) {
      if (mv.kind === "opening") opening[mv.item] += qty;
      else if (mv.kind === "restock") opening[mv.item] += qty;
      else if (mv.kind === "issue") opening[mv.item] -= qty;
      else if (mv.kind === "adjustment") opening[mv.item] += qty;
      continue;
    }
    if (mv.kind === "restock") {
      received[mv.item] += qty;
      spend += Number(mv.amount) || 0;
    } else if (mv.kind === "issue") {
      issued[mv.item] += qty;
      if (mv.memberId) learners.add(mv.memberId);
    } else if (mv.kind === "adjustment") {
      adjusted[mv.item] += qty;
    }
  }

  const closing = zero();
  for (const key of KIT_ITEM_KEYS) {
    closing[key] = opening[key] + received[key] + adjusted[key] - issued[key];
  }

  return {
    period: range.label,
    opening,
    received,
    issued,
    closing,
    spend: Math.round(spend * 100) / 100,
    learners: learners.size,
  };
}