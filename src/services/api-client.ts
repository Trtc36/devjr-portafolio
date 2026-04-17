import { apiEndpoints } from "@/services/api-endpoints";
import { request } from "@/services/http";

export const apiClient = {
  projects: () => request(apiEndpoints.projects),
  projectBySlug: (slug: string) => request(apiEndpoints.projectBySlug(slug)),
  blogPosts: () => request(apiEndpoints.blogPosts),
  blogPostBySlug: (slug: string) => request(apiEndpoints.blogPostBySlug(slug)),
  tags: () => request(apiEndpoints.tags),
  technologies: () => request(apiEndpoints.technologies),
};
