# Fortius Inmuebles

Sitio público y panel operativo de Fortius Inmuebles (Tijuana, BC): [fortiusinmuebles.com](https://fortiusinmuebles.com).

- **Sitio:** inmuebles, servicios, blog y calculadoras. Sus documentos están en [`docs/sitio/`](docs/sitio/).
- **Panel:** el nuevo se construye en `/panel`; el anterior, `/admin`, sigue en uso mientras tanto.

Next.js, React, TypeScript y Tailwind; Supabase (autenticación, datos y archivos con RLS); Vercel. Producción se publica desde `main`.

## Desarrollo local

Requiere Node.js 24. Copia `.env.example` como `.env.local`, apúntalo a un proyecto de Supabase de pruebas y ejecuta:

```text
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3001
```

`SUPABASE_SERVICE_ROLE_KEY` se usa solo en el servidor; nunca con prefijo `NEXT_PUBLIC_*` ni en el repositorio.

## Antes de integrar en `main`

```text
npm run verify
```

Corre lint, tipos, pruebas y build. Las pruebas de navegador van aparte (`npm run test:public:browser` y `npm run test:admin:browser`). GitHub corre lo mismo al marcar listo un PR.

## Base de datos

Las migraciones están en `supabase/migrations` y se aplican en orden al integrar en `main`. Nunca se reescribe una migración ya aplicada.

## Documentación

- [PLAN.md](PLAN.md): qué falta y cómo va.
- [SPEC.md](SPEC.md): reglas y decisiones vigentes.
- [docs/README.md](docs/README.md): despliegue, respaldos, privacidad, formatos y marca.
