import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RecordsLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/signin");
  if (session.user.role !== "admin") redirect("/unauthorized");

  return <>{children}</>;
}