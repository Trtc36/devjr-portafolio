import { blogPosts } from "@/features/blog/data/posts";

export function getBlogPosts() {
  return blogPosts;
}

export function getFeaturedBlogPosts() {
  return blogPosts.filter((post) => post.isFeatured);
}

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
