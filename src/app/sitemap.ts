import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getProjects } from "@/services/projects.service";
import { getBlogPosts } from "@/services/blog.service";

export const revalidate = 3600;

const STATIC_PATHS = ["/", "/projects", "/blog", "/about", "/contact"] as const;

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://devjr.example.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [projects, posts] = await Promise.all([getProjects(), getBlogPosts()]);

  const staticEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: `${baseUrl}/${locale}${path === "/" ? "" : path}`,
    })),
  );

  const projectEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    projects.map((project) => ({
      url: `${baseUrl}/${locale}/projects/${project.slug}`,
      lastModified: project.publishedAt,
    })),
  );

  const blogEntries: MetadataRoute.Sitemap = routing.locales.flatMap((locale) =>
    posts.map((post) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: post.publishedAt,
    })),
  );

  return [...staticEntries, ...projectEntries, ...blogEntries];
}
