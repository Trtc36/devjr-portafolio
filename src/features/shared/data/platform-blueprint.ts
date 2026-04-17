import type { AppLocale } from "@/i18n/routing";
import type { LocalizedString } from "@/types/common";

type LocalizedItem = {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
};

export const focusAreas: LocalizedItem[] = [
  {
    id: "focus-backend",
    title: {
      en: "Backend platforms",
      es: "Plataformas backend",
    },
    description: {
      en: "Service boundaries, operational APIs and productized internal tooling.",
      es: "Limites de servicio, APIs operativas y tooling interno tratado como producto.",
    },
  },
  {
    id: "focus-data",
    title: {
      en: "Data movement",
      es: "Movimiento de datos",
    },
    description: {
      en: "ETL telemetry, freshness control and resilient reporting surfaces.",
      es: "Telemetria ETL, control de frescura y superficies de reporting resilientes.",
    },
  },
  {
    id: "focus-saas",
    title: {
      en: "SaaS product systems",
      es: "Sistemas SaaS",
    },
    description: {
      en: "Products that support operators, managers and engineering teams without excess friction.",
      es: "Productos que ayudan a operadores, managers y equipos de ingenieria sin friccion innecesaria.",
    },
  },
];

export const platformBlueprint: LocalizedItem[] = [
  {
    id: "blueprint-frontend",
    title: {
      en: "Frontend shell",
      es: "Shell frontend",
    },
    description: {
      en: "The interface is treated as a product surface: clear navigation, deliberate hierarchy and reusable primitives that scale without visual drift.",
      es: "La interfaz se trata como una superficie de producto: navegacion clara, jerarquia deliberada y primitivas reutilizables que escalan sin deriva visual.",
    },
  },
  {
    id: "blueprint-api",
    title: { en: "Service boundary", es: "Limite de servicio" },
    description: {
      en: "Domain rules, editorial content and portfolio data stay behind a strict application boundary so the experience remains maintainable and trustworthy.",
      es: "Las reglas de dominio, el contenido editorial y los datos del portafolio quedan detras de un limite de aplicacion estricto para mantener la experiencia mantenible y confiable.",
    },
  },
  {
    id: "blueprint-data",
    title: { en: "Operational data", es: "Datos operativos" },
    description: {
      en: "Content, metrics and taxonomy are modeled so they remain queryable, observable and simple to evolve as the system grows.",
      es: "El contenido, las metricas y la taxonomia se modelan para seguir siendo consultables, observables y simples de evolucionar conforme crece el sistema.",
    },
  },
];

export const quickFacts = [
  {
    id: "fact-locales",
    label: {
      en: "Locales",
      es: "Idiomas",
    },
    value: "EN / ES",
  },
  {
    id: "fact-boundary",
    label: {
      en: "Delivery model",
      es: "Modelo de entrega",
    },
    value: "Domain-first",
  },
  {
    id: "fact-data",
    label: {
      en: "Product lens",
      es: "Enfoque de producto",
    },
    value: "Operational clarity",
  },
];

export function localizeItem(value: LocalizedString, locale: AppLocale) {
  return value[locale];
}
