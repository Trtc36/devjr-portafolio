import type { Project } from "@/features/projects/types/project";
import { tags, technologies } from "@/features/shared/data/taxonomy";

export const projects: Project[] = [
  {
    id: "project-fleet",
    slug: "fleet-ops-control-tower",
    title: {
      en: "FleetOps Control Tower",
      es: "FleetOps Control Tower",
    },
    summary: {
      en: "A logistics visibility platform for dispatch, SLA monitoring and carrier exception tracking.",
      es: "Una plataforma de visibilidad logistica para despacho, monitoreo de SLA y seguimiento de excepciones con transportistas.",
    },
    problem: {
      en: "Regional dispatch teams were coordinating shipments through spreadsheets and messaging groups, creating delays in exception handling and poor ETA confidence.",
      es: "Los equipos regionales de despacho coordinaban embarques con hojas de calculo y grupos de mensajeria, generando retrasos en la atencion de excepciones y poca confianza en los ETA.",
    },
    solution: {
      en: "Designed a modular control tower with live shipment states, route segmentation, operational alerts and role-based views for planners and coordinators.",
      es: "Se diseno una torre de control modular con estados de envio en vivo, segmentacion por ruta, alertas operativas y vistas por rol para planners y coordinadores.",
    },
    architecture: {
      en: "Frontend delivered as a locale-aware App Router interface, backed by planned ASP.NET Core services that expose shipment aggregates, incident timelines and KPI snapshots.",
      es: "El frontend se plantea como una interfaz App Router con soporte de idioma, respaldada por servicios ASP.NET Core para exponer agregados de envios, lineas de tiempo de incidentes y snapshots de KPI.",
    },
    impact: {
      en: "The platform turned fragmented dispatch coordination into a shared operational surface with clearer ownership, faster response loops and decision-grade visibility for planners.",
      es: "La plataforma convirtio una coordinacion dispersa en una superficie operativa compartida con ownership mas claro, ciclos de respuesta mas rapidos y visibilidad util para planners.",
    },
    coverImageUrl: "/images/projects/fleet-ops.svg",
    galleryImages: [
      {
        id: "fleet-dashboard",
        label: { en: "Operations dashboard", es: "Dashboard operativo" },
        description: {
          en: "Shipment volume, on-time trend and blocker signals.",
          es: "Volumen de envios, tendencia de puntualidad y senales de bloqueo.",
        },
      },
      {
        id: "fleet-routes",
        label: { en: "Route segmentation", es: "Segmentacion por ruta" },
        description: {
          en: "Route-level backlog and SLA risk monitoring.",
          es: "Monitoreo por ruta de backlog y riesgo de SLA.",
        },
      },
    ],
    repoUrl: "https://github.com/devjr/fleet-ops-control-tower",
    demoUrl: "https://devjr.example.com/fleet-ops",
    isFeatured: true,
    publishedAt: "2026-02-14",
    metrics: [
      {
        label: { en: "Exception response time", es: "Tiempo de respuesta a excepciones" },
        value: "-42%",
      },
      {
        label: { en: "On-time visibility coverage", es: "Cobertura de visibilidad on-time" },
        value: "96%",
      },
      {
        label: { en: "Dispatch coordination touchpoints", es: "Puntos de coordinacion de despacho" },
        value: "-31%",
      },
    ],
    technologies: [technologies[0], technologies[1], technologies[2], technologies[3], technologies[4]],
    tags: [tags[0], tags[2], tags[3]],
  },
  {
    id: "project-pulse",
    slug: "etl-pulse-monitor",
    title: {
      en: "ETL Pulse Monitor",
      es: "ETL Pulse Monitor",
    },
    summary: {
      en: "An operational observability layer for ETL jobs, data quality checks and refresh latency.",
      es: "Una capa de observabilidad operativa para jobs ETL, validaciones de calidad de datos y latencia de refresh.",
    },
    problem: {
      en: "Data teams had fragmented visibility over job failures, stale datasets and manual handoffs between ingestion and BI consumers.",
      es: "Los equipos de datos tenian visibilidad fragmentada sobre fallas de jobs, datasets obsoletos y handoffs manuales entre ingesta y consumidores BI.",
    },
    solution: {
      en: "Built a monitoring surface that consolidates pipeline health, freshness windows, validation outcomes and escalation states.",
      es: "Se construyo una superficie de monitoreo que consolida salud de pipelines, ventanas de frescura, resultados de validacion y estados de escalamiento.",
    },
    architecture: {
      en: "The product boundary separates ingestion telemetry, validation results and presentation concerns to keep downstream consumers independent from orchestration internals.",
      es: "El limite del producto separa telemetria de ingesta, resultados de validacion y presentacion para mantener a los consumidores downstream independientes de los internos de orquestacion.",
    },
    impact: {
      en: "Analysts and engineering owners gained one place to assess data freshness, pipeline health and escalation state before incidents reached business users.",
      es: "Analistas y responsables de ingenieria obtuvieron un solo lugar para evaluar frescura, salud de pipelines y estado de escalamiento antes de afectar a usuarios de negocio.",
    },
    coverImageUrl: "/images/projects/etl-pulse.svg",
    galleryImages: [
      {
        id: "etl-latency",
        label: { en: "Freshness board", es: "Tablero de frescura" },
        description: {
          en: "Latency and SLA consumption by pipeline.",
          es: "Latencia y consumo de SLA por pipeline.",
        },
      },
      {
        id: "etl-quality",
        label: { en: "Quality checks", es: "Controles de calidad" },
        description: {
          en: "Validation failures grouped by domain owner.",
          es: "Fallas de validacion agrupadas por responsable de dominio.",
        },
      },
    ],
    repoUrl: "https://github.com/devjr/etl-pulse-monitor",
    isFeatured: true,
    publishedAt: "2026-01-29",
    metrics: [
      {
        label: { en: "Data incident detection", es: "Deteccion de incidentes de datos" },
        value: "<10 min",
      },
      {
        label: { en: "Manual validation effort", es: "Esfuerzo manual de validacion" },
        value: "-58%",
      },
      {
        label: { en: "Business refresh confidence", es: "Confianza en el refresh de negocio" },
        value: "High",
      },
    ],
    technologies: [technologies[1], technologies[2], technologies[3], technologies[5]],
    tags: [tags[1], tags[2], tags[4]],
  },
  {
    id: "project-hub",
    slug: "service-request-hub",
    title: {
      en: "Service Request Hub",
      es: "Service Request Hub",
    },
    summary: {
      en: "An internal platform for handling enterprise requests, approvals and service-level commitments.",
      es: "Una plataforma interna para gestionar solicitudes empresariales, aprobaciones y compromisos de nivel de servicio.",
    },
    problem: {
      en: "Business units were creating support tickets through email chains, making prioritization, ownership and SLA reporting inconsistent.",
      es: "Las unidades de negocio generaban tickets por cadenas de correo, lo que hacia inconsistente la priorizacion, el ownership y el reporte de SLA.",
    },
    solution: {
      en: "Implemented a request intake product with intake rules, approval checkpoints, process metrics and a service catalog view.",
      es: "Se implemento un producto de intake de solicitudes con reglas de entrada, checkpoints de aprobacion, metricas de proceso y una vista de catalogo de servicios.",
    },
    architecture: {
      en: "A service-oriented backend roadmap separates requests, approvals, notifications and reporting projections to enable future admin capabilities.",
      es: "La hoja de ruta backend orientada a servicios separa solicitudes, aprobaciones, notificaciones y proyecciones de reporting para habilitar futuras capacidades administrativas.",
    },
    impact: {
      en: "Service teams gained a more legible intake model, measurable approvals and an operating cadence that can scale without folding back into email-based triage.",
      es: "Los equipos de servicio ganaron un modelo de intake mas legible, aprobaciones medibles y una cadencia operativa que puede escalar sin volver al triage por correo.",
    },
    coverImageUrl: "/images/projects/request-hub.svg",
    galleryImages: [
      {
        id: "hub-queue",
        label: { en: "Request queue", es: "Cola de solicitudes" },
        description: {
          en: "Priority, ownership and cycle-time visibility.",
          es: "Visibilidad de prioridad, ownership y tiempo de ciclo.",
        },
      },
      {
        id: "hub-catalog",
        label: { en: "Service catalog", es: "Catalogo de servicios" },
        description: {
          en: "Structured request types with expected commitments.",
          es: "Tipos de solicitud estructurados con compromisos esperados.",
        },
      },
    ],
    demoUrl: "https://devjr.example.com/service-request-hub",
    isFeatured: false,
    publishedAt: "2025-11-10",
    metrics: [
      {
        label: { en: "Approval lead time", es: "Tiempo de aprobacion" },
        value: "-37%",
      },
      {
        label: { en: "SLA reporting coverage", es: "Cobertura de reporte SLA" },
        value: "100%",
      },
      {
        label: { en: "Request rework", es: "Retrabajo de solicitudes" },
        value: "-24%",
      },
    ],
    technologies: [technologies[0], technologies[1], technologies[2], technologies[3]],
    tags: [tags[2], tags[4], tags[3]],
  },
];
