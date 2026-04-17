import type { LocalizedString, Tag, Technology } from "@/types/common";

export type ProjectMetric = {
  label: LocalizedString;
  value: string;
};

export type ProjectArtifact = {
  id: string;
  label: LocalizedString;
  description: LocalizedString;
};

export type Project = {
  id: string;
  slug: string;
  title: LocalizedString;
  summary: LocalizedString;
  problem: LocalizedString;
  solution: LocalizedString;
  architecture: LocalizedString;
  impact: LocalizedString;
  coverImageUrl: string;
  galleryImages: ProjectArtifact[];
  repoUrl?: string;
  demoUrl?: string;
  isFeatured: boolean;
  publishedAt: string;
  metrics: ProjectMetric[];
  technologies: Technology[];
  tags: Tag[];
};
