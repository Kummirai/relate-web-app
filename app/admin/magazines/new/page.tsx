import { getDb } from "@/lib/mongodb";
import { requireServerAdmin } from "@/lib/session";
import MagazineEditor from "@/components/admin/MagazineEditor";

/** Creates a fresh magazine, or pre-fills the editor by cloning an existing one. */
export default async function NewMagazinePage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string }>;
}) {
  await requireServerAdmin();
  const { clone } = await searchParams;

  let initial: Record<string, any> | null = null;
  if (clone) {
    const db = await getDb();
    const doc = await db.collection("publications").findOne({ id: clone });
    if (doc) {
      initial = {
        ...doc,
        _id: undefined,
        id: "",
        title: "",
        status: "draft",
        publishedAt: null,
      };
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0fa3c4]">Library</p>
        <h1 className="font-display text-3xl font-bold text-[#1d2a4d]">
          {initial ? "New magazine (cloned from an existing issue)" : "New magazine"}
        </h1>
        <p className="mt-1 text-sm text-[#6b7a8d]">
          Start with a fresh issue — pick a club, add a cover, then build sections or a seasonal study guide.
        </p>
      </div>
      <MagazineEditor initial={null} cloneSource={initial} />
    </div>
  );
}