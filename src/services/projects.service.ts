import { projects } from "@/features/projects/data/projects";

export function getProjects() {
  return projects;
}

export function getFeaturedProjects() {
  return projects.filter((project) => project.isFeatured);
}

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
