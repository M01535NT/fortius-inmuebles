import { expect, it } from 'vitest';
import { publishedAdviser } from '@/lib/backend/validation';
const base = { id: 'agent1', nombre: 'Asesor', cargo: 'Asesor inmobiliario', iniciales: 'A', activo: true, email: 'internal@example.com', telefono: '1234567890', notas: 'Private' };
it('publishes only opted-in profiles of active advisers', () => {
 expect(publishedAdviser(base)).toBeNull();
 expect(publishedAdviser({...base, perfilPublico:{publicado:false, descripcion:'Bio'}})).toBeNull();
 expect(publishedAdviser({...base, activo:false, perfilPublico:{publicado:true, descripcion:'Bio'}})).toBeNull();
});
it('exposes only deliberately public fields, never internal contact data', () => {
 const profile=publishedAdviser({...base, perfilPublico:{publicado:true, descripcion:'Bio', email:'public@example.com', notas:'Private', foto:'/storage/v1/object/sign/private/photo.jpg'}});
 expect(profile?.email).toBe('public@example.com');
 expect(profile).not.toHaveProperty('telefono');
 expect(profile).not.toHaveProperty('notas');
 expect(profile).not.toHaveProperty('foto');
});
it('rejects unsafe profile links',()=>{
 expect(publishedAdviser({...base,perfilPublico:{publicado:true,descripcion:'Bio',instagram:'javascript:alert(1)'}})).toBeNull();
});
