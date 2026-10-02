# Resiliencia y bloqueo de UX — menú mobile + páginas de error (sub-proyecto 2/6)

Fecha: 2026-10-02
Origen: `docs/audit-2026-10-01.md`, hallazgos 1.1/2.1 (menú mobile ausente, Crítico/Alto) y 1.2 (falta `error.tsx`/`not-found.tsx`/`global-error.tsx`, Alto).
Alcance: Next.js 16.2.3 / React 19, App Router. `error.tsx`/`global-error.tsx` usan el nuevo prop `unstable_retry()` (añadido en v16.2.0) en vez de `reset()` — confirmado en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`.

## Objetivo

1. Dar navegación completa en mobile (hoy el nav de escritorio se oculta con `hidden md:flex` sin ningún reemplazo — hallazgo más grave del proyecto, bloquea navegación para el tráfico mayoritario esperado).
2. Evitar que una caída del backend ASP.NET (o cualquier error de render) muestre la pantalla de error genérica de Next, rompiendo la identidad de marca en el escenario de fallo más probable del sitio.

Fuera de alcance explícito: performance/SEO, limpieza de shims, accesibilidad más allá de lo que Radix Dialog da gratis, rediseño visual (sub-proyectos 3-6).

## A. Menú mobile (hamburguesa + Radix Dialog)

### Nueva dependencia

- `@radix-ui/react-dialog` (misma familia que `@radix-ui/react-slot`, ya presente).

### `src/components/layout/nav-items.ts` (nuevo)

Extrae el array `navItems` (hoy definido localmente en `main-nav.tsx`) a un módulo compartido:

```ts
export const navItems = [
  { href: "/", label: "nav.home" },
  { href: "/projects", label: "nav.projects" },
  { href: "/blog", label: "nav.blog" },
  { href: "/about", label: "nav.about" },
  { href: "/contact", label: "nav.contact" },
] as const;
```

`main-nav.tsx` importa este array en vez de definirlo localmente — una sola fuente de verdad para que el nav de escritorio y el mobile nunca se desincronicen.

### `src/components/layout/mobile-nav.tsx` (nuevo, `"use client"`)

- Botón trigger: ícono `Menu` (`lucide-react`), visible solo `md:hidden`, mismo estilo que el botón de `ThemeToggle` (`Button variant="ghost" size="sm"`, `aria-label={t("nav.openMenu")}`).
- `Dialog.Root` **controlado** (`open`/`onOpenChange` vía `useState`) — necesario para poder cerrar el panel manualmente al hacer click en un link, antes de que la navegación ocurra.
- `Dialog.Portal` → `Dialog.Overlay` (fade in/out) → `Dialog.Content`: drawer que entra desde la derecha, alto completo, `bg-[hsl(var(--surface))]`, borde izquierdo y sombra consistentes con los tokens ya usados en `main-nav.tsx`/`header.tsx`.
- `Dialog.Title` con texto `t("nav.menuTitle")`, visualmente oculto con la utilidad `sr-only` de Tailwind (requerido por Radix para accesibilidad; no se necesita un `Dialog.Description` — se pasa `aria-describedby={undefined}` si Radix se queja en consola).
- Botón de cierre: ícono `X`, `Dialog.Close asChild`, `aria-label={t("nav.closeMenu")}`.
- Lista de links: itera `navItems` (igual que `main-nav.tsx`), cada `Link` con `onClick={() => setOpen(false)}` para cerrar el drawer antes de navegar.
- Radix resuelve gratis: focus-trap dentro del panel, cierre con tecla ESC, bloqueo de scroll del `body` mientras está abierto, y devolver el foco al botón trigger al cerrar.

### Animación (`src/app/globals.css`, extendido)

Dos `@keyframes` nuevos (slide-in del panel desde la derecha, fade del overlay) aplicados vía clases utilitarias disparadas por los atributos `data-[state=open|closed]` que Radix ya expone en `Dialog.Content`/`Dialog.Overlay` — sin añadir `framer-motion` ni el plugin `tailwindcss-animate`.

### `src/components/layout/header.tsx` (modificado)

Renderiza `<MobileNav />` junto a `<MainNav />`. `MainNav` sigue oculto bajo `md` (sin cambios); `MobileNav`'s trigger solo visible bajo `md` (`md:hidden`). `ThemeToggle`/`LanguageSwitcher` no se tocan — ya son visibles en todos los breakpoints hoy.

### i18n (nuevas keys en `en/common.json` y `es/common.json`, bajo `nav`)

- `nav.openMenu`: "Open menu" / "Abrir menú"
- `nav.closeMenu`: "Close menu" / "Cerrar menú"
- `nav.menuTitle`: "Navigation menu" / "Menú de navegación"

## B. Footer — enlace "about"

`src/components/layout/footer.tsx`: un `<Link href="/about" locale={locale} className="transition-colors hover:text-[hsl(var(--foreground))]">{t("nav.about")}</Link>` agregado al grupo de enlaces existente (mismo patrón que `projects`/`blog`/`contact`). La key `nav.about` ya existe — no se agregan traducciones nuevas.

## C. `error.tsx` / `not-found.tsx` / `global-error.tsx`

Las cuatro páginas reutilizan `PageShell` + `PageHero` (variant `highlight`) — ya diseñado para titular + descripción + acciones, consistente con el resto del sitio. Copy breve y profesional en los 4 casos.

### `src/app/[locale]/error.tsx` (nuevo, `"use client"`)

- Boundary de errores del segmento `[locale]` — envuelve `page.tsx`, **no** envuelve `layout.tsx` (Header/Footer/`NextIntlClientProvider` siguen renderizando alrededor, el chrome del sitio no se pierde).
- `useTranslations("common")` (mismo patrón ya probado en `main-nav.tsx`/`theme-toggle.tsx` como client component bajo el `NextIntlClientProvider` actual, que no pasa `messages`/`locale` explícitos).
- Props: `{ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }`.
- `useEffect(() => { console.error(error); }, [error])` — sin integrar servicio de monitoreo (ninguno existe en el proyecto, fuera de alcance).
- `PageHero` con título/descripción de error + `actions`: botón "Reintentar" (`onClick={() => unstable_retry()}`) y link "Volver al inicio" (`/`).

### `src/app/[locale]/not-found.tsx` (nuevo, Server Component)

- Se dispara con `notFound()` (slugs de blog/proyecto inexistentes) y rutas no encontradas dentro de `[locale]/*`.
- No recibe `params` (confirmado: "not-found.js... do not accept any props"), pero `getTranslations({ namespace: "common" })` sin `locale` explícito sigue resolviendo bien porque `src/i18n/request.ts` deriva el locale del request en curso, no de un prop.
- `PageHero` con título "página no encontrada" + acciones "Volver al inicio" y "Ver el blog".

### `src/app/global-error.tsx` (nuevo, root-level, `"use client"`)

- Fallback catastrófico — reemplaza `src/app/layout.tsx` por completo: sin `NextIntlClientProvider`, sin Header/Footer, sin fuentes de Google.
- Debe definir su propio `<html>/<body>` (requisito de Next). Reimporta `./globals.css` y `@/styles/tokens.css` directamente para conservar los tokens de color de marca (incluye el modo oscuro); **no** carga las fuentes IBM Plex — usa `system-ui, sans-serif` inline, para no depender de una descarga de fuente externa en el peor escenario de fallo posible.
- Copy estático en inglés (sin next-intl, que podría ser justo lo que falló), un `<a href="/en">` plano (no el `Link` de `@/i18n/navigation`, que depende del contexto i18n que aquí no existe).
- No exporta `metadata`/`generateMetadata` (no soportado en `global-error.jsx` al ser Client Component — restricción documentada).

### `src/app/not-found.tsx` (raíz, fuera de `[locale]`, Server Component)

- Cubre URLs no reconocidas por ningún segmento en absoluto.
- Tampoco usa next-intl ni Header/Footer (no disponibles en este nivel) — página mínima autocontenida con los tokens de marca (ya cargados por `src/app/layout.tsx`, que sí sigue activo para este archivo ya que vive dentro del árbol normal de rutas, a diferencia de `global-error.tsx`), link a `/en`.

## Testing

No existe infraestructura de testing de componentes React en este proyecto (Vitest está configurado para Node, sin jsdom/React Testing Library — fuera de alcance añadir eso solo para este sub-proyecto, YAGNI). Verificación:

- **Manual, en navegador** (`npm run dev`):
  1. Viewport mobile (<768px): el botón hamburguesa abre el drawer con los 5 links; cada link navega y cierra el drawer; ESC cierra; el foco vuelve al botón trigger.
  2. Navegar a un slug de blog/proyecto inexistente → ver el `not-found.tsx` con el chrome del sitio (Header/Footer) intacto.
  3. Forzar un error (ej. lanzar una excepción temporal en un `page.tsx` de prueba) → ver `error.tsx` con botón "Reintentar" funcional.
  4. Navegar a una URL completamente fuera de cualquier segmento (ej. sin prefijo de locale reconocible) → ver el `not-found.tsx` raíz.
  5. (Difícil de forzar realista mente sin romper el layout raíz a propósito) Revisión visual de `global-error.tsx` aislada, confirmando que compila y que sus estilos/tokens se ven correctos sin depender del resto del árbol.
- `npx tsc --noEmit` y `npm test` (suite existente) deben seguir en verde — ningún archivo de este sub-proyecto toca código ya cubierto por tests existentes.

## Archivos tocados (resumen)

- `src/components/layout/nav-items.ts` (nuevo)
- `src/components/layout/main-nav.tsx` (modificado — importa `navItems`)
- `src/components/layout/mobile-nav.tsx` (nuevo)
- `src/components/layout/header.tsx` (modificado — renderiza `MobileNav`)
- `src/components/layout/footer.tsx` (modificado — link "about")
- `src/app/globals.css` (modificado — 2 `@keyframes` nuevos)
- `src/i18n/messages/en/common.json`, `src/i18n/messages/es/common.json` (modificados — 3 keys nuevas bajo `nav`)
- `src/app/[locale]/error.tsx` (nuevo)
- `src/app/[locale]/not-found.tsx` (nuevo)
- `src/app/global-error.tsx` (nuevo)
- `src/app/not-found.tsx` (nuevo)
- `package.json` (nueva dependencia: `@radix-ui/react-dialog`)
