import { notFound, redirect } from "next/navigation";
import { ProcessStageWorkspace } from "@/components/admin/workspace/process-stage";
import { getProcessStage, LEGACY_PROCESS_SLUGS } from "@/components/admin/workspace/module-catalog";
export default async function ProcessStagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  if (LEGACY_PROCESS_SLUGS[stage]) redirect(`/admin/proceso/${LEGACY_PROCESS_SLUGS[stage]}`);
  if (!getProcessStage(stage)) notFound();
  return <ProcessStageWorkspace stage={stage} />;
}
