import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import type { StaffUser } from "./contracts";
import { ApiError, databaseError } from "./http";
import { profileSchema, storedProfileSchema } from "./profile";

const ACCESS_COOKIE = "fortius-inmuebles-access-token";
const REFRESH_COOKIE = "fortius-inmuebles-refresh-token";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", priority: "high" as const };

export function supabaseEnvironment(environment = process.env) {
  // This server-only client reads its deployment environment at runtime.
  // Direct NEXT_PUBLIC references would freeze these values into the build.
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const key = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ApiError(503, "El servicio Fortius no está configurado");
  return { url, key };
}

export function createServerClient(accessToken?: string, privileged = false): SupabaseClient {
  const { url, key } = supabaseEnvironment();
  const apiKey = privileged ? process.env.SUPABASE_SERVICE_ROLE_KEY : key;
  if (!apiKey) throw new ApiError(503, "La recepción de solicitudes no está configurada");
  return createClient(url, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: init?.signal ?? AbortSignal.timeout(15000) }),
    },
  });
}

export function staffIdentity(user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null, membership: { role: string; active: boolean } | null): StaffUser {
  if (!user) throw new ApiError(401, "Inicia sesión para continuar");
  if (!membership?.active || !["admin", "editor"].includes(membership.role)) throw new ApiError(403, "Tu usuario no tiene acceso al panel Fortius");
  const profile = storedProfileSchema.safeParse(user.user_metadata?.fortius_profile);
  return { id: user.id, email: user.email ?? "", role: membership.role as StaffUser["role"], ...(profile.success ? profile.data : {}) };
}

export async function updateProfile(input: unknown) {
  const profile = profileSchema.parse(input);
  const { accessToken, user } = await requireStaff();
  if (profile.avatar.startsWith("data:")) {
    const uploaded = await createServerClient(undefined, true).storage.from("fortius-inmuebles-private").upload(`profiles/${user.id}/avatar.jpg`, Buffer.from(profile.avatar.split(",")[1], "base64"), { contentType: "image/jpeg", upsert: true });
    if (uploaded.error) throw new ApiError(503, "No se pudo guardar la fotografía");
    profile.avatar = `/api/auth/profile/photo?v=${randomUUID()}`;
  }
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) throw new ApiError(401, "Vuelve a iniciar sesión para guardar tu perfil");
  const client = createServerClient();
  const established = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (established.error || !established.data.session) throw new ApiError(401, "Sesión vencida");
  const result = await client.auth.updateUser({ data: { fortius_profile: profile } });
  if (result.error) throw new ApiError(503, "No se pudo guardar el perfil. Conserva la página abierta y reintenta.");
  await saveSession(established.data.session);
  return { ok: true };
}

async function verifyStaff(client: SupabaseClient, token: string): Promise<StaffUser> {
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "Sesión inválida o vencida");
  const membership = await client.from("fortius_inmuebles_staff").select("role,active").eq("user_id", data.user.id).maybeSingle();
  if (membership.error) databaseError(membership.error);
  return staffIdentity(data.user, membership.data);
}

async function saveSession(session: Session) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, session.access_token, { ...cookieOptions, maxAge: session.expires_in });
  jar.set(REFRESH_COOKIE, session.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function requireStaff(): Promise<{ user: StaffUser; client: SupabaseClient; accessToken: string }> {
  const jar = await cookies();
  let token = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!token && !refreshToken) throw new ApiError(401, "Inicia sesión para continuar");
  if (token) {
    const client = createServerClient(token);
    try { return { user: await verifyStaff(client, token), client, accessToken: token }; }
    catch (error) { if (!(error instanceof ApiError) || error.status !== 401) throw error; }
  }
  if (!refreshToken) { await clearSession(); throw new ApiError(401, "Sesión vencida"); }
  const authClient = createServerClient();
  const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) { await clearSession(); throw new ApiError(401, "Sesión vencida"); }
  token = data.session.access_token;
  const client = createServerClient(token);
  const user = await verifyStaff(client, token);
  await saveSession(data.session);
  return { user, client, accessToken: token };
}

export async function loginWithPassword(input: unknown): Promise<{ user: StaffUser }> {
  const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) }).strict().parse(input);
  const authClient = createServerClient();
  const { data, error } = await authClient.auth.signInWithPassword(credentials);
  if (error) {
    if (error.code === "invalid_credentials") throw new ApiError(401, "Correo o contraseña incorrectos");
    if (error.status === 429) throw new ApiError(429, "Demasiados intentos de acceso; inténtalo más tarde");
    if (error.code === "email_not_confirmed") throw new ApiError(403, "Confirma tu correo antes de iniciar sesión");
    throw new ApiError(503, "El servicio de acceso no está disponible; inténtalo de nuevo");
  }
  if (!data.session) throw new ApiError(503, "El servicio de acceso no devolvió una sesión válida");
  const user = await verifyStaff(createServerClient(data.session.access_token), data.session.access_token);
  await saveSession(data.session);
  return { user };
}

export async function acceptAuthCallback(input: unknown): Promise<{ user: StaffUser }> {
  const type = z.enum(["invite", "recovery"]);
  const payload = z.union([
    z.object({ type, token_hash: z.string().min(20).max(2048) }).strict(),
    z.object({ type, access_token: z.string().min(20).max(8192), refresh_token: z.string().min(10).max(2048) }).strict(),
  ]).parse(input);
  const authClient = createServerClient();
  const { data, error } = "token_hash" in payload
    ? await authClient.auth.verifyOtp({ type: payload.type, token_hash: payload.token_hash })
    : await authClient.auth.setSession({ access_token: payload.access_token, refresh_token: payload.refresh_token });
  if (error || !data.session) throw new ApiError(401, "Invitación o recuperación inválida o vencida");
  const user = await verifyStaff(createServerClient(data.session.access_token), data.session.access_token);
  await saveSession(data.session);
  return { user };
}

export async function changePassword(input: unknown): Promise<{ ok: true }> {
  const { password } = z.object({ password: z.string().min(12).max(128) }).strict().parse(input);
  const { accessToken } = await requireStaff();
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) throw new ApiError(401, "Solicita un enlace nuevo para establecer la contraseña");
  // updateUser requires Supabase's in-memory Auth session, not just the request's
  // Authorization header. No browser storage is involved.
  const authClient = createServerClient();
  const established = await authClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (established.error || !established.data.session) throw new ApiError(401, "Sesión vencida");
  const { error } = await authClient.auth.updateUser({ password });
  if (error) throw new ApiError(400, "No se pudo cambiar la contraseña; solicita un enlace nuevo si la sesión venció");
  await saveSession(established.data.session);
  return { ok: true };
}

export async function logoutSession(): Promise<{ ok: true }> {
  // Revoke the refresh session when possible, but always remove local cookies.
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  try { if (token) await createServerClient().auth.admin.signOut(token, "local"); }
  finally { await clearSession(); }
  return { ok: true };
}

export async function requestRecovery(input: unknown, redirectTo: string): Promise<{ ok: true }> {
  const { email } = z.object({ email: z.email().max(254) }).strict().parse(input);
  const { error } = await createServerClient().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    if (error.status === 429) throw new ApiError(429, "Demasiadas solicitudes de acceso; inténtalo más tarde");
    // Never return account existence or the provider's SMTP/server details.
    throw new ApiError(503, "No se pudo solicitar el correo de acceso; inténtalo más tarde");
  }
  return { ok: true };
}
