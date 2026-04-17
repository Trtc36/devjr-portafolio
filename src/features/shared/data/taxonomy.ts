import type { Tag, Technology } from "@/types/common";

export const technologies: Technology[] = [
  { id: "tech-1", name: "Next.js", icon: "layers-3" },
  { id: "tech-2", name: "TypeScript", icon: "braces" },
  { id: "tech-3", name: "ASP.NET Core", icon: "server-cog" },
  { id: "tech-4", name: "PostgreSQL", icon: "database" },
  { id: "tech-5", name: "Docker", icon: "container" },
  { id: "tech-6", name: "Power BI", icon: "chart-column" }
];

export const tags: Tag[] = [
  {
    id: "tag-logistics",
    slug: "logistics",
    type: "domain",
    name: { en: "Logistics", es: "Logística" }
  },
  {
    id: "tag-etl",
    slug: "etl",
    type: "focus",
    name: { en: "ETL Pipelines", es: "Pipelines ETL" }
  },
  {
    id: "tag-backend",
    slug: "backend",
    type: "focus",
    name: { en: "Backend Architecture", es: "Arquitectura Backend" }
  },
  {
    id: "tag-dashboard",
    slug: "dashboard",
    type: "domain",
    name: { en: "Operational Dashboards", es: "Dashboards Operativos" }
  },
  {
    id: "tag-enterprise",
    slug: "enterprise",
    type: "domain",
    name: { en: "Enterprise Software", es: "Software Empresarial" }
  }
];
