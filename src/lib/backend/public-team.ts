import "server-only";
import { cache } from "react";
import { createServerClient } from "./auth";
import { listRecords } from "./repository";
import { publishedAdviser } from "./validation";

/** Explicit opt-in and projection: internal contact fields never leave the server. */
export const getPublishedTeam = cache(async () => {
  // Sin el secreto de servidor no hay lectura privilegiada. La página conserva
  // el perfil ilustrativo en lugar de fallar por una vista previa sin esa clave.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const records = await listRecords(createServerClient(undefined, true), "asesores");
  return records.flatMap(record => {
    const profile = publishedAdviser(record.data);
    return profile ? [profile] : [];
  });
});
