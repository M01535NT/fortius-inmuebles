import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { saveRun } from '@/lib/apps/repository';
import { getFinancialDefaults, calculateFinancial } from '@/lib/apps/financial';
it('persists a server recalculation instead of a forged financial result',async()=>{let saved:Record<string,unknown>={};const client={from:()=>({insert:(value:Record<string,unknown>)=>{saved=value;return {select:()=>({single:async()=>({data:{...value,id:'run',version:1,updated_at:'2026-10-13'},error:null})})};}})} as unknown as SupabaseClient;const input={...getFinancialDefaults('conversor'),amount:'10',from:'m2',to:'ft2'};const result=calculateFinancial('conversor',input);const run=await saveRun(client,'user',{slug:'conversor',title:'Prueba',context:{},input,result:{title:'forged',summary:[{label:'Falso',value:'9999999'}]}});expect(saved.result).toEqual(result);expect(run.result?.title).not.toBe('forged');});
describe('saved result input validation',()=>{it('rejects invalid financial inputs before database write',async()=>{await expect(saveRun({} as SupabaseClient,'user',{slug:'hipoteca',title:'x',input:{},context:{},result:{title:'fake',summary:[]}})).rejects.toThrow();});it('rejects property mismatch',async()=>{await expect(saveRun({} as SupabaseClient,'user',{slug:'ficha-comercial',title:'x',input:{propertySlug:'other'},context:{inmuebleId:'one'},result:null})).rejects.toThrow('inmueble');});});

describe('retry after a lost save response', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const body = { id, slug: 'conversor', title: 'Borrador', input: { amount: '10' }, result: null, context: {} };
  function existingClient(version: number, title = body.title) {
    const row = { ...body, title, version, updated_at: '2026-10-13' };
    const query = { eq: () => query, is: () => query, maybeSingle: async () => ({ data: row, error: null }) };
    const updated = { eq: () => updated, is: () => updated, select: () => updated, maybeSingle: async () => ({ data: null, error: null }) };
    return { from: () => ({ select: () => query, update: () => updated, insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: '23505' } }) }) }) }) } as unknown as SupabaseClient;
  }
  it('returns the existing creation without duplicating the work', async () => {
    expect((await saveRun(existingClient(1), 'user', body)).version).toBe(1);
  });
  it('returns the saved next version when retrying exactly the same update', async () => {
    expect((await saveRun(existingClient(2), 'user', { ...body, version: 1 })).version).toBe(2);
  });
  it('preserves a conflicting version instead of claiming the retry succeeded', async () => {
    await expect(saveRun(existingClient(2, 'Cambio de otro usuario'), 'user', { ...body, version: 1 })).rejects.toThrow('El trabajo cambió');
    await expect(saveRun(existingClient(1, 'Otro borrador'), 'user', body)).rejects.toThrow('datos distintos');
  });
});
