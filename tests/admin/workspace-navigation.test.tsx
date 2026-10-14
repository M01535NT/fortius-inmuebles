import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import {
  WorkspaceNavigation,
  type AdminModule,
} from "@/components/admin/workspace/navigation";
const icon = () => null;
const modules: AdminModule[] = [
  { href: "/admin", label: "Panel", icon, group: "Operación" },
  { href: "/admin/inmuebles", label: "Inmuebles", icon, group: "Operación" },
  {
    href: "/admin/reports",
    label: "Reportes",
    icon,
    group: "Administración",
    adminOnly: true,
  },
];
afterEach(() => {
  cleanup();
  localStorage.clear();
});
test("additional modules can collapse after reordering without losing primary routes", () => {
  const compactModules = modules.map(item => ({ ...item, group: item.href === "/admin/reports" ? "Equipo" : "Principal" }));
  render(<WorkspaceNavigation modules={compactModules} userId="compact" role="admin" pathname="/admin" onNavigate={() => {}} />);
  expect(screen.queryByRole("link", { name: "Reportes" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Organizar módulos" }));
  fireEvent.click(screen.getByRole("button", { name: "Subir Inmuebles" }));
  fireEvent.click(screen.getByRole("button", { name: "Terminar organización" }));
  fireEvent.click(screen.getByRole("button", { name: "Ocultar más" }));
  expect(screen.queryByRole("link", { name: "Reportes" })).toBeNull();
  expect(screen.getByRole("link", { name: "Inmuebles" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Más" }));
  expect(screen.getByRole("link", { name: "Reportes" })).toBeTruthy();
});
function show(userId = "one", role = "admin") {
  return render(
    <WorkspaceNavigation
      modules={modules}
      userId={userId}
      role={role}
      pathname="/admin"
      onNavigate={() => {}}
    />,
  );
}
test("keyboard controls persist module order across remounts and restore default", () => {
  const mounted = show();
  fireEvent.click(screen.getByRole("button", { name: "Organizar módulos" }));
  fireEvent.click(screen.getByRole("button", { name: "Subir Inmuebles" }));
  expect(screen.getAllByRole("link")[0].textContent).toBe("Inmuebles");
  mounted.unmount();
  show();
  expect(screen.getAllByRole("link")[0].textContent).toBe("Inmuebles");
  fireEvent.click(screen.getByRole("button", { name: "Organizar módulos" }));
  fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
  expect(screen.getAllByRole("link")[0].textContent).toBe("Panel");
});
test("stored order is scoped to account and cannot reveal restricted modules", () => {
  localStorage.setItem(
    "fortius:modules:one",
    JSON.stringify([
      "/admin/reports",
      "/admin/inmuebles",
      "/unknown",
      "/admin/inmuebles",
    ]),
  );
  const a = show("one", "editor");
  expect(screen.queryByRole("link", { name: "Reportes" })).toBeNull();
  expect(screen.getAllByRole("link")).toHaveLength(2);
  a.unmount();
  show("two", "admin");
  expect(screen.getAllByRole("link")[0].textContent).toBe("Panel");
});
test("desktop and mobile navigation instances synchronize", () => {
  render(
    <>
      <section aria-label="Desktop">
        <WorkspaceNavigation
          modules={modules}
          userId="shared"
          role="admin"
          pathname="/admin"
          onNavigate={() => {}}
        />
      </section>
      <section aria-label="Mobile">
        <WorkspaceNavigation
          modules={modules}
          userId="shared"
          role="admin"
          pathname="/admin"
          onNavigate={() => {}}
        />
      </section>
    </>,
  );
  const desktop = within(screen.getByRole("region", { name: "Desktop" })),
    mobile = within(screen.getByRole("region", { name: "Mobile" }));
  fireEvent.click(desktop.getByRole("button", { name: "Organizar módulos" }));
  fireEvent.click(desktop.getByRole("button", { name: "Subir Inmuebles" }));
  expect(mobile.getAllByRole("link")[0].textContent).toBe("Inmuebles");
});
