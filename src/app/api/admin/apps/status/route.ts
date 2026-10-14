import { createPrivateKey } from "node:crypto";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";
import { readIntegrationConfig, maximumCostCents, validateProviderUrl, type IntegrationSlug } from "@/lib/apps/integrations/core";

function configured(slug: IntegrationSlug): boolean {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return false;
  try {
    const env = Object.fromEntries(Object.entries(process.env).map(([key, value]) => [key, value?.trim()]));
    const config = readIntegrationConfig(slug, env);
    if (new Date(config.priceDate).toISOString().slice(0, 10) !== config.priceDate) return false;
    if (slug === "ocr") {
      if (!/^[a-z0-9-]+$/.test(env.GOOGLE_DOCUMENT_AI_PROJECT!) || !["us", "eu"].includes(env.GOOGLE_DOCUMENT_AI_LOCATION!) || !/^[a-zA-Z0-9_-]+$/.test(env.GOOGLE_DOCUMENT_AI_PROCESSOR!)) return false;
      if (createPrivateKey(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n")).asymmetricKeyType !== "rsa") return false;
    }
    if (slug === "firmas") {
      const hosts = env.DOCUSEAL_ARTIFACT_HOSTS!.split(",").map(host => host.trim()).filter(Boolean);
      if (!hosts.length) return false;
      for (const host of hosts) validateProviderUrl(`https://${host}/`, hosts);
    }
    return config.fixedCents + config.reserveCents + maximumCostCents(config, 1) <= config.budgetCents;
  } catch {
    return false;
  }
}
export async function GET() {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const table = await client.from("fortius_inmuebles_app_runs").select("id").limit(1);
    return {
      storage: !table.error,
      providers: {
        docuseal: configured("firmas"),
        "google-ocr": configured("ocr"),
        openai: configured("consulta-documental"),
        "google-routes": configured("rutas"),
      },
    };
  });
}
