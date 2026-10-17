import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const { clientCollection, push } = vi.hoisted(() => ({ clientCollection: {}, push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/admin/store', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/admin/store')>(),
  db: { clientes: clientCollection, propiedades: {}, asesores: {} },
  useCollection: (collection: object) => collection === clientCollection ? [{ id: 'c1', nombre: 'Cliente de prueba', asesorId: 'a1' }] : [],
}));
import { DirectCreate } from '@/components/admin/operation/direct-create';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); push.mockReset(); });
it('abre una operación sin capturar su folio y lleva a la operación con el folio asignado', async () => {
  const writes: Record<string, unknown>[] = [];
  vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      writes.push(JSON.parse(String(init.body)));
      return Response.json({ expediente: { id: 'new-exp', cliente_id: 'c1', asesor_id: 'a1', folio: 'EXP-000021', operacion: 'venta', unidad: '', etapa: 'captacion', version: 1 } });
    }
    return Response.json({});
  });
  render(<DirectCreate />);
  expect(screen.queryByLabelText(/Folio/)).toBeNull();
  expect(screen.getByText('El folio se asigna al guardar.')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'c1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Abrir operación' }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]).not.toHaveProperty('folio');
  expect(writes[0]).toMatchObject({ clienteId: 'c1', asesorId: 'a1', operacion: 'venta', flujo: { ruta: 'captacion', estado: 'activa' } });
  await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/operaciones/new-exp'));
});
it('pide asignar un asesor al cliente antes de abrir la operación', async () => {
  vi.stubGlobal('fetch', vi.fn());
  render(<DirectCreate />);
  fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Alta directa' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Asigna un asesor responsable');
  expect(fetch).not.toHaveBeenCalled();
});
