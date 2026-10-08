"use client";
import Link from "next/link";
import { useSession } from "@/lib/admin/store";
import { btnGhost } from "@/components/admin/ui";
export function HistoryLink({
  collection,
  id,
}: {
  collection: string;
  id: string;
}) {
  const session = useSession();
  return session?.role === "admin" ? (
    <Link
      className={btnGhost}
      href={`/admin/historial?${new URLSearchParams({ collection, record: id })}`}
    >
      Historial de cambios
    </Link>
  ) : null;
}
