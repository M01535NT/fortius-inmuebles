import { afterAll, beforeAll, expect, it } from "vitest";
// @ts-expect-error Isolated restoration helper is intentionally JavaScript.
import { createRehearsalDatabase } from "../../tools/fortius-inmuebles-restore-current.mjs";
import type { PGlite } from "@electric-sql/pglite";

// SEG-M5 (auditoría del 13/11/2026): contador propio de intentos de acceso, solo para el servidor.
let db: PGlite;
const key = `login:ip:${"a".repeat(64)}`;
const attempt = (k: string, limit: number) => db.query<{ n: number }>("select public.fortius_inmuebles_auth_attempt($1,$2) n", [k, limit]);
beforeAll(async () => { db = await createRehearsalDatabase(); });
afterAll(async () => { await db?.close(); });

it("cuenta por clave y responde PT429 al pasar el límite", async () => {
  await db.exec("set role service_role");
  try {
    expect((await attempt(key, 2)).rows[0].n).toBe(1);
    expect((await attempt(key, 2)).rows[0].n).toBe(2);
    await expect(attempt(key, 2)).rejects.toMatchObject({ code: "PT429" });
    expect((await attempt(`login:email:${"b".repeat(64)}`, 2)).rows[0].n).toBe(1);
    // Solo huellas: una IP o un correo en claro no son una clave válida.
    await expect(attempt("login:ip:203.0.113.7", 2)).rejects.toMatchObject({ code: "PT400" });
  } finally { await db.exec("reset role"); }
});

it("ni visitantes ni personal pueden llamarla directo", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    try { await expect(attempt(key, 2)).rejects.toThrow(/permission denied/); } finally { await db.exec("reset role"); }
  }
});
