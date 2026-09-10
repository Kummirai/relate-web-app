import { requireServerAdmin } from "@/lib/session";
import MagazinesList from "@/components/admin/MagazinesList";

/** Admin: list, publish/unpublish, clone and delete magazines. */
export default async function MagazinesPage() {
  await requireServerAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <MagazinesList />
    </div>
  );
}