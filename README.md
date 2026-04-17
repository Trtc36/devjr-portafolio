# DevJR Portfolio Platform

Technical portfolio platform for the DevJR personal brand. The frontend is built with Next.js 16 App Router and is structured to evolve from typed mock data into a real API-driven product.

## Phase 1 Scope

- Locale-first frontend foundation with `next-intl`
- Dark/light theme with `next-themes`
- Feature-oriented project and blog domain models
- Mock services prepared to be replaced by backend APIs
- Production-minded routes for home, projects, project detail, blog, blog detail, about and contact

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- `next-intl`
- `next-themes`
- `framer-motion`
- `lucide-react`
- shadcn-style UI primitives

## Project Structure

```text
src/
  app/
  components/
  features/
    blog/
    projects/
    shared/
  i18n/
  lib/
  services/
  styles/
  types/
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app redirects `/` to `/en`.

## Build

```bash
npm run build
```

## Current Frontend Architecture

- `src/i18n`: locale routing, request config and message namespaces
- `src/features`: domain types and mock content for projects and blog
- `src/services`: service boundary for future backend consumption
- `src/components`: reusable UI, layout and content cards
- `src/app/[locale]`: localized App Router routes

## Next Steps

- Add ASP.NET Core backend
- Replace mock services with API consumption
- Add admin-ready DTO contracts and pagination
- Introduce form-backed contact workflow
