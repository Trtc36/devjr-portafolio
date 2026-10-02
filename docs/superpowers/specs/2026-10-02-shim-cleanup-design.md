# Limpieza de arquitectura — eliminar archivos shim (sub-proyecto 4/6)

Fecha: 2026-10-02
Origen: `docs/audit-2026-10-01.md`, hallazgo 4.1 (migración incompleta hacia `ui/`/`layout/`/`features/`, Bajo riesgo).

## Objetivo

Terminar una migración de componentes que quedó a medias: 6 archivos en `src/components/` son re-exports de una sola línea hacia su ubicación real en `ui/`, `layout/` o `features/`. Esto deja dos rutas de importación válidas para el mismo componente conviviendo en el repo, generando confusión sobre cuál es la fuente real.

## Alcance

Confirmado por lectura directa de los 6 archivos y por grep de todo `src/` buscando quién los importa:

| Shim | Re-exporta de | Importado por |
|---|---|---|
| `src/components/card.tsx` | `@/components/ui/card` | `about/page.tsx`, `contact/page.tsx` |
| `src/components/page-shell.tsx` | `@/components/layout/page-shell` | `about/page.tsx`, `contact/page.tsx` |
| `src/components/section-shell.tsx` | `@/components/layout/section-shell` | `about/page.tsx`, `contact/page.tsx` |
| `src/components/badge.tsx` | `@/components/ui/badge` | Nadie (código muerto) |
| `src/components/button.tsx` | `@/components/ui/button` | Nadie (código muerto) |
| `src/components/project-card.tsx` | `@/features/projects/components/project-card` | Nadie (código muerto) |

## Cambios

1. **Eliminar** los 6 archivos shim completos.
2. **Actualizar** `src/app/[locale]/about/page.tsx`: los 3 imports que apuntan a shims cambian a su destino real (`@/components/ui/card`, `@/components/layout/page-shell`, `@/components/layout/section-shell`). El resto del archivo no se toca.
3. **Actualizar** `src/app/[locale]/contact/page.tsx`: mismos 3 cambios de import, mismo criterio.

No hay más importadores de estos 6 archivos en todo `src/` (confirmado por grep) — no hay un tercer archivo a tocar.

## Testing

- `npx tsc --noEmit`: es la red de seguridad real de este cambio — cualquier import no actualizado a un archivo borrado falla aquí inmediatamente, antes que cualquier otra cosa.
- `npm run lint`: sin nuevas advertencias/errores en los 2 archivos modificados.
- `npm test` (suite existente, 51 tests): sin regresión — ninguno de estos 8 archivos está cubierto por tests hoy.
- Manual: no requerido — es un cambio de rutas de import sin efecto visual ni de comportamiento (los componentes reales no cambian).
