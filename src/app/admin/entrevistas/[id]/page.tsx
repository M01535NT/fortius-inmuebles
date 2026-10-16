import { redirect } from "next/navigation";

/** Las entrevistas se retoman y consultan dentro del asistente de Nueva operación. */
export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/operaciones/nueva?entrevista=${encodeURIComponent(id)}`);
}
