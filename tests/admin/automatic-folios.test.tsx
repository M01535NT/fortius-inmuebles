import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const { clientCollection } = vi.hoisted(() => ({ clientCollection: {} }));
vi.mock('@/lib/admin/store', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/admin/store')>(),
  db: { clientes: clientCollection, propiedades: {}, asesores: {} },
  useCollection: (collection: object) => collection === clientCollection ? [{ id: 'c1', nombre: 'Cliente de prueba', asesorId: 'a1' }] : [],
}));
import ExpedientesPage from '@/app/admin/operaciones/page';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });
it('creates an expediente without manually capturing its folio and displays the assigned value', async () => {
  window.history.replaceState(null, '', '/admin/operaciones?nuevo=1');
  const writes: Record<string, unknown>[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      writes.push(JSON.parse(String(init.body)));
      return Response.json({ expediente: { id: 'new-exp', cliente_id: 'c1', asesor_id: 'a1', folio: 'EXP-000021', operacion: 'venta', unidad: '', etapa: 'captacion', version: 1 } });
    }
    return Response.json(url.endsWith('/formatos') ? { documentos: [] } : { expedientes: [] });
  });
  render(<ExpedientesPage />);
  const field = screen.getByLabelText('Folio del expediente') as HTMLInputElement;
  expect(field.readOnly).toBe(true);
  expect(field.required).toBe(false);
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'c1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear expediente' }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).not.toHaveProperty('folio');
  expect(writes[0]).toMatchObject({ clienteId: 'c1', asesorId: 'a1', operacion: 'venta' });
  expect((await screen.findByRole('status')).textContent).toBe('Expediente creado: EXP-000021.');
});
