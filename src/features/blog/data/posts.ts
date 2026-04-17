import type { BlogPost } from "@/features/blog/types/blog-post";
import { tags } from "@/features/shared/data/taxonomy";

export const blogPosts: BlogPost[] = [
  {
    id: "post-control-tower",
    slug: "designing-control-towers-for-logistics-operations",
    title: {
      en: "Designing control towers for logistics operations",
      es: "Diseñar torres de control para operaciones logísticas"
    },
    excerpt: {
      en: "How to structure operational visibility products without collapsing dispatch, incident handling and analytics into one unstable surface.",
      es: "Cómo estructurar productos de visibilidad operativa sin colapsar despacho, atención de incidentes y analítica en una sola superficie inestable."
    },
    coverImageUrl: "/images/blog/control-tower.svg",
    publishedAt: "2026-03-08",
    readTime: "8 min",
    tags: [tags[0], tags[2]],
    isFeatured: true,
    sections: [
      {
        id: "separate-concerns",
        title: {
          en: "Separate monitoring from coordination",
          es: "Separar monitoreo de coordinación"
        },
        body: [
          {
            en: "Control towers fail when they try to become both the system of record and the coordination surface. The better boundary is to consume shipment state, SLA projections and incident feeds while leaving transactional ownership in upstream systems.",
            es: "Las torres de control fallan cuando intentan ser al mismo tiempo sistema de registro y superficie de coordinación. El límite correcto es consumir estado de embarques, proyecciones SLA y feeds de incidentes, dejando el ownership transaccional en sistemas upstream."
          },
          {
            en: "That separation gives planners a reliable decision layer without forcing every operational workflow through a single product bottleneck.",
            es: "Esa separación da a los planners una capa de decisión confiable sin obligar a que todo flujo operativo pase por un único cuello de botella de producto."
          }
        ]
      },
      {
        id: "metrics",
        title: {
          en: "Design metrics around interventions",
          es: "Diseñar métricas alrededor de intervenciones"
        },
        body: [
          {
            en: "Track response time to exceptions, confidence in ETA predictions and backlog risk by route. Those are the signals that change operations, not vanity counters.",
            es: "Conviene medir tiempo de respuesta a excepciones, confianza en predicciones ETA y riesgo de backlog por ruta. Esas son las señales que cambian la operación, no los contadores de vanidad."
          }
        ]
      }
    ]
  },
  {
    id: "post-etl",
    slug: "operational-observability-for-etl-pipelines",
    title: {
      en: "Operational observability for ETL pipelines",
      es: "Observabilidad operativa para pipelines ETL"
    },
    excerpt: {
      en: "A practical approach to turning pipeline telemetry into decisions for analysts, business teams and engineering owners.",
      es: "Un enfoque práctico para convertir telemetría de pipelines en decisiones para analistas, equipos de negocio y responsables de ingeniería."
    },
    coverImageUrl: "/images/blog/etl-observability.svg",
    publishedAt: "2026-02-19",
    readTime: "6 min",
    tags: [tags[1], tags[3]],
    isFeatured: true,
    sections: [
      {
        id: "freshness",
        title: {
          en: "Freshness is a product signal",
          es: "La frescura es una señal de producto"
        },
        body: [
          {
            en: "Business dashboards do not fail only when jobs fail. They also fail when freshness expectations drift silently. Make freshness windows explicit and communicate them in the same place users inspect data health.",
            es: "Los dashboards de negocio no fallan solo cuando falla un job. También fallan cuando la expectativa de frescura se degrada en silencio. Conviene volver explícitas las ventanas de frescura y comunicarlas en el mismo lugar donde el usuario revisa salud de datos."
          }
        ]
      },
      {
        id: "ownership",
        title: {
          en: "Map failures to owners",
          es: "Mapear fallos a responsables"
        },
        body: [
          {
            en: "Observability becomes useful when validation failures, lineage breaks and stale datasets are already grouped by accountable domain owner.",
            es: "La observabilidad se vuelve útil cuando fallos de validación, quiebres de lineage y datasets obsoletos ya están agrupados por responsable de dominio."
          }
        ]
      }
    ]
  },
  {
    id: "post-services",
    slug: "service-boundaries-for-internal-enterprise-products",
    title: {
      en: "Service boundaries for internal enterprise products",
      es: "Límites de servicio para productos empresariales internos"
    },
    excerpt: {
      en: "Internal software deserves explicit domain boundaries, especially when approvals, requests and reporting evolve at different speeds.",
      es: "El software interno merece límites de dominio explícitos, especialmente cuando aprobaciones, solicitudes y reporting evolucionan a ritmos distintos."
    },
    coverImageUrl: "/images/blog/service-boundaries.svg",
    publishedAt: "2025-12-12",
    readTime: "7 min",
    tags: [tags[2], tags[4]],
    isFeatured: false,
    sections: [
      {
        id: "modularity",
        title: {
          en: "Avoid monolithic workflows",
          es: "Evitar flujos monolíticos"
        },
        body: [
          {
            en: "Request intake, approvals, notifications and reporting projections usually look like one process to the business. They should not become one deployment unit by default.",
            es: "La entrada de solicitudes, aprobaciones, notificaciones y proyecciones de reporting suelen verse como un solo proceso para el negocio. No deberían convertirse automáticamente en una sola unidad de despliegue."
          }
        ]
      }
    ]
  }
];
