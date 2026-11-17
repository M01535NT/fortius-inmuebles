# Fortius Inmuebles

Sitio público y panel de Fortius Inmuebles. Sitio: [fortiusinmuebles.com](https://fortiusinmuebles.com).

**Esta rama (`rediseno-sitio`) rehace el sitio público.** No toca el panel.

| Qué | Dónde |
|---|---|
| Qué debe ser el sitio | [SPEC.md](SPEC.md) |
| En qué orden se hace | [PLAN.md](PLAN.md) |
| Cómo se hace | [DECISIONS.md](DECISIONS.md) |
| Reglas de trabajo | [AGENTS.md](AGENTS.md) |
| Operación, respaldos, legal y cálculos | [docs/README.md](docs/README.md) |

## Para correrlo en tu computadora

Requiere Node.js 24. Copia `.env.example` como `.env.local` y ejecuta:

```text
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Hecho con Next.js, React, TypeScript y Tailwind; datos en Supabase; publicado en Vercel desde `main`.
