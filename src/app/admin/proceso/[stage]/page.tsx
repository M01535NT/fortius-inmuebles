import { notFound } from "next/navigation";
import { ProcessStageWorkspace } from "@/components/admin/workspace/process-stage";
import { getProcessStage } from "@/components/admin/workspace/module-catalog";
export default async function ProcessStagePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params;
  if (!getProcessStage(stage)) notFound();
  return <ProcessStageWorkspace stage={stage} />;
}
