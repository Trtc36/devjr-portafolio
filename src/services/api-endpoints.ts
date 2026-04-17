export const apiEndpoints = {
  projects: "/api/projects",
  projectBySlug: (slug: string) => `/api/projects/${slug}`,
  blogPosts: "/api/blog-posts",
  blogPostBySlug: (slug: string) => `/api/blog-posts/${slug}`,
  tags: "/api/tags",
  technologies: "/api/technologies",
} as const;
