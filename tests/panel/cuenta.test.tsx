import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AvisosProvider } from "@/components/panel/kit/avisos";
import {
  CLAVE_MAXIMO, codigoCompleto, estadoDosPasos, fechaRegistro, limpiarCodigo, pideVolverAEntrar, puedeAgregarDispositivo, revisarClaveNueva,
} from "@/lib/panel/cuenta";

/*
  Cuenta y seguridad del panel nuevo: las reglas de pantalla y las dos pantallas (entrada y Configuración → Seguridad)
  con la sesión simulada. Las llamadas reales son las del provisional y sus reglas las prueba el servidor.
*/
const sesion = vi.hoisted(() => ({
  mfa: false,
  acceptPasswordLink: vi.fn(),
  changePassword: vi.fn(),
  confirmMfaEnrollment: vi.fn(),
  isLoggedIn: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  mfaStatus: vi.fn(),
  recoverPassword: vi.fn(),
  startMfaEnrollment: vi.fn(),
  verifyMfaCode: vi.fn(),
}));

vi.mock("@/lib/panel/legado/sesion", () => ({
  ...sesion,
  needsMfaCode: () => sesion.mfa,
  errorMessage: (e: unknown) => (e instanceof Error ? e.message : "No se pudo terminar."),
  useSession: () => null,
  useSessionExpired: () => false,
}));

const { Acceso } = await import("@/components/panel/acceso");
const { SeccionSeguridad } = await import("@/components/panel/configuracion/seguridad");

class ErrorServidor extends Error {
  constructor(public status: number, message: string, public details?: { reauth?: boolean }) { super(message); }
}

beforeEach(() => { sesion.mfa = false; Object.values(sesion).forEach((f) => { if (typeof f === "function") f.mockReset(); }); });
afterEach(() => cleanup());

const conAvisos = (ui: React.ReactElement) => render(<AvisosProvider>{ui}</AvisosProvider>);

test("cuenta: la contraseña nueva pide de 12 a 128 caracteres y que las dos coincidan", () => {
  expect(revisarClaveNueva("corta", "corta")).toMatch(/al menos 12/);
  expect(revisarClaveNueva("x".repeat(CLAVE_MAXIMO + 1), "x".repeat(CLAVE_MAXIMO + 1))).toMatch(/máximo 128/);
  expect(revisarClaveNueva("una frase larga", "una frase largA")).toMatch(/no coinciden/);
  expect(revisarClaveNueva("una frase larga", "una frase larga")).toBeNull();
});

test("cuenta: el código de la app se limpia de espacios y guiones y pide seis dígitos", () => {
  expect(limpiarCodigo("123 456")).toBe("123456");
  expect(limpiarCodigo("123-4567")).toBe("123456");
  expect(codigoCompleto("12345")).toBe(false);
  expect(codigoCompleto("12345a")).toBe(false);
  expect(codigoCompleto("123456")).toBe(true);
});

test("cuenta: estado de los dos pasos, hasta dos dispositivos y fecha legible", () => {
  expect(estadoDosPasos(0)).toBe("Apagada");
  expect(estadoDosPasos(1)).toBe("Activa en un dispositivo");
  expect(estadoDosPasos(2)).toBe("Activa en 2 dispositivos");
  expect(puedeAgregarDispositivo(1)).toBe(true);
  expect(puedeAgregarDispositivo(2)).toBe(false);
  expect(fechaRegistro("2026-11-13T18:00:00Z")).toContain("noviembre de 2026");
  expect(fechaRegistro("no es fecha")).toBe("fecha desconocida");
});

test("cuenta: se pide volver a entrar con el aviso del servidor o un 401, no con otros errores", () => {
  expect(pideVolverAEntrar(new ErrorServidor(401, "Por seguridad, vuelve a iniciar sesión"))).toBe(true);
  expect(pideVolverAEntrar(new ErrorServidor(403, "x", { reauth: true }))).toBe(true);
  expect(pideVolverAEntrar(new ErrorServidor(400, "El código no coincide"))).toBe(false);
  expect(pideVolverAEntrar("texto")).toBe(false);
  expect(pideVolverAEntrar(null)).toBe(false);
});

test("acceso: «¿Olvidaste tu contraseña?» manda el correo y responde igual exista o no la cuenta", async () => {
  sesion.recoverPassword.mockResolvedValue(undefined);
  render(<Acceso />);
  expect(screen.getByRole("link", { name: "Volver al sitio" }).getAttribute("href")).toBe("/");
  fireEvent.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }));
  expect(screen.getByRole("heading", { name: "Recupera tu acceso" })).toBeTruthy();
  expect(screen.queryByLabelText("Contraseña")).toBeNull();
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: " ana@ejemplo.test " } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }));
  await screen.findByRole("status");
  expect(sesion.recoverPassword).toHaveBeenCalledWith("ana@ejemplo.test");
  expect(screen.getByRole("status").textContent).toContain("Si el correo tiene acceso");
  fireEvent.click(screen.getByRole("button", { name: "Volver a entrar" }));
  expect(screen.getByRole("heading", { name: "Entra al panel" })).toBeTruthy();
});

test("acceso: la contraseña se puede ver mientras se escribe", () => {
  render(<Acceso />);
  const campo = screen.getByLabelText("Contraseña") as HTMLInputElement;
  expect(campo.type).toBe("password");
  fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
  expect(campo.type).toBe("text");
  expect(screen.getByRole("button", { name: "Ocultar contraseña" }).getAttribute("aria-pressed")).toBe("true");
});

test("acceso: desde el enlace del correo se elige la contraseña; si no coinciden avisa y no manda nada", async () => {
  sesion.changePassword.mockResolvedValue(undefined);
  const listo = vi.fn();
  render(<Acceso fijarClave alTerminarClave={listo} />);
  expect(screen.getByRole("heading", { name: "Elige tu contraseña" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: "una frase larga" } });
  fireEvent.change(screen.getByLabelText("Escríbela otra vez"), { target: { value: "otra frase larga" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));
  expect(screen.getByRole("alert").textContent).toContain("no coinciden");
  expect(sesion.changePassword).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Escríbela otra vez"), { target: { value: "una frase larga" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));
  await waitFor(() => expect(listo).toHaveBeenCalled());
  expect(sesion.changePassword).toHaveBeenCalledWith("una frase larga");
});

test("acceso: un enlace de una cuenta con dos pasos pide primero el código y luego la contraseña", async () => {
  sesion.mfa = true;
  sesion.verifyMfaCode.mockImplementation(async () => { sesion.mfa = false; return true; });
  render(<Acceso fijarClave />);
  expect(screen.getByRole("heading", { name: "Código de verificación" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Código"), { target: { value: "123 456" } });
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
  await screen.findByRole("heading", { name: "Elige tu contraseña" });
  expect(sesion.verifyMfaCode).toHaveBeenCalledWith("123456");
});

test("acceso: el aviso de un enlace vencido se muestra al abrir", () => {
  render(<Acceso errorInicial="El enlace no es válido o ha caducado. Solicita uno nuevo." />);
  expect(screen.getByRole("alert").textContent).toContain("caducado");
});

test("seguridad: cambiar la contraseña; con acceso viejo lo dice y ofrece salir y volver a entrar", async () => {
  sesion.mfaStatus.mockResolvedValue({ available: false, devices: [] });
  sesion.changePassword.mockRejectedValue(new ErrorServidor(401, "Por seguridad, vuelve a iniciar sesión para cambiar la contraseña"));
  sesion.logout.mockResolvedValue(undefined);
  conAvisos(<SeccionSeguridad />);
  fireEvent.click(screen.getByRole("button", { name: "Contraseña. Cambiar" }));
  fireEvent.change(await screen.findByLabelText("Contraseña nueva"), { target: { value: "una frase larga" } });
  fireEvent.change(screen.getByLabelText("Escríbela otra vez"), { target: { value: "una frase larga" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));
  expect((await screen.findByRole("alert")).textContent).toContain("vuelve a iniciar sesión");
  fireEvent.click(screen.getByRole("button", { name: "Salir y volver a entrar" }));
  expect(sesion.logout).toHaveBeenCalled();
});

test("seguridad: el asesor no ve los dos pasos (lo decide el servidor)", async () => {
  sesion.mfaStatus.mockResolvedValue({ available: false, devices: [] });
  conAvisos(<SeccionSeguridad />);
  await waitFor(() => expect(sesion.mfaStatus).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(screen.queryByText("Verificación en dos pasos")).toBeNull();
});

test("seguridad: el director activa los dos pasos con el QR o la clave y lo confirma con el código", async () => {
  sesion.mfaStatus.mockResolvedValueOnce({ available: true, devices: [] })
    .mockResolvedValueOnce({ available: true, devices: [{ id: "f1", createdAt: "2026-11-19T10:00:00Z" }] });
  sesion.startMfaEnrollment.mockResolvedValue({ factorId: "00000000-0000-4000-8000-000000000001", qr: "data:image/svg+xml;base64,PHN2Zy8+", secret: "CLAVEDEEJEMPLO" });
  sesion.confirmMfaEnrollment.mockResolvedValue({ ok: true });
  conAvisos(<SeccionSeguridad />);
  expect((await screen.findByText("Apagada"))).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Activar" }));
  expect(await screen.findByAltText("Código QR para tu app de verificación")).toBeTruthy();
  expect((screen.getByLabelText("Clave para escribirla a mano") as HTMLInputElement).readOnly).toBe(true);
  // Sin los seis dígitos avisa y no manda.
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  expect(screen.getByRole("alert").textContent).toContain("6 dígitos");
  expect(sesion.confirmMfaEnrollment).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Código de la app"), { target: { value: "654321" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  await screen.findByText("Activa en un dispositivo");
  expect(sesion.confirmMfaEnrollment).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", "654321");
  expect(screen.queryByLabelText("Clave para escribirla a mano")).toBeNull();
  expect(screen.getByRole("button", { name: "Agregar otro dispositivo" })).toBeTruthy();
});

test("seguridad: con dos dispositivos ya no ofrece agregar otro ni quitarlos", async () => {
  sesion.mfaStatus.mockResolvedValue({ available: true, devices: [{ id: "a", createdAt: "2026-11-01T10:00:00Z" }, { id: "b", createdAt: "2026-11-02T10:00:00Z" }] });
  conAvisos(<SeccionSeguridad />);
  await screen.findByText("Activa en 2 dispositivos");
  expect(screen.getByText("Dispositivo 2")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Agregar|Activar|Quitar|Desactivar/ })).toBeNull();
});

test("seguridad: activar con acceso viejo dice que hay que volver a entrar", async () => {
  sesion.mfaStatus.mockResolvedValue({ available: true, devices: [] });
  sesion.startMfaEnrollment.mockRejectedValue(new ErrorServidor(401, "Por seguridad, sal y vuelve a entrar antes de activar la verificación en dos pasos", { reauth: true }));
  conAvisos(<SeccionSeguridad />);
  fireEvent.click(await screen.findByRole("button", { name: "Activar" }));
  expect((await screen.findByRole("alert")).textContent).toContain("vuelve a entrar");
  expect(screen.getByRole("button", { name: "Salir y volver a entrar" })).toBeTruthy();
});
