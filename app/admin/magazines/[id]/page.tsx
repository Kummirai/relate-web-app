import { notFound } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import { requireServerAdmin } from "@/lib/session";
import MagazineEditor from "@/components/admin/MagazineEditor";

export default async function EditMagazinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireServerAdmin();
  const { id } = await params;
  const db = await getDb();
  const doc = await db.collection("publications").findOne({ id });
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#0fa3c4]">Library</p>
        <h1 className="font-display text-3xl font-bold text-[#1d2a4d]">Edit magazine</h1>
        <p className="mt-1 text-sm text-[#6b7a8d]">
          {doc.id} · {doc.status === "published" ? "published" : "draft"}
        </p>
      </div>
      <MagazineEditor initial={doc} />
    </div>
  );
}