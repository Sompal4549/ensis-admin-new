import { api } from "./api";

/** Flat post shape the admin's blog list and editor work with */
export interface BlogPostItem {
  _id?: string;
  id?: number | string;
  title: string;
  h1Title?: string;
  slug: string;
  excerpt?: string;
  content: string;
  category: string;
  author: string;
  tags?: string[] | string;
  status: "published" | "draft" | "scheduled" | "archived" | string;
  showOnHome: boolean;
  featured: boolean;
  scheduledDate?: string | null;
  readTime: string;
  image: string;
  imageAlt?: string;
  views: number;
  publishDate?: string | Date;

  // SEO Fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  canonicalTag?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  openGraphTags?: string;
  schemaMarkup?: string;

  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface GetBlogsResponse {
  posts: BlogPostItem[];
  total: number;
  page: number;
  totalPages: number;
}

/** Blog as the Ensis backend stores it (sections the website's blog page renders) */
type EnsisBlog = {
  _id?: string;
  title?: string;
  slug?: string;
  author?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  viewCount?: number;
  banner?: { title?: string; highlight?: string; date?: string; readingTime?: string; category?: string; backgroundImage?: string; backgroundImageAlt?: string };
  blogImage?: { image?: string; alt?: string };
  article?: { content?: string };
  aboutTheAuthor?: { name?: string };
  seo?: { metaTitle?: string; metaDescription?: string; metaKeywords?: string; canonical?: string; ogJson?: string; schema?: string };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const plain = (html = "") =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

/** og:title / og:description / og:image live in the backend's ogJson string */
const readOg = (ogJson?: string): Record<string, string> => {
  try {
    return ogJson ? JSON.parse(ogJson) : {};
  } catch {
    return {};
  }
};

const toItem = (b: EnsisBlog): BlogPostItem => {
  const og = readOg(b.seo?.ogJson);
  const content = b.article?.content || "";
  const text = plain(content);
  return {
    _id: b._id,
    id: b._id,
    title: b.title || "",
    h1Title: [b.banner?.title, b.banner?.highlight].filter(Boolean).join(" ") || b.title || "",
    slug: b.slug || "",
    excerpt: b.seo?.metaDescription || text.slice(0, 180),
    content,
    category: b.category || b.banner?.category || "",
    author: b.author || b.aboutTheAuthor?.name || "",
    tags: b.tags || [],
    status: b.isActive === false ? "draft" : "published",
    showOnHome: Boolean(b.isFeatured),
    featured: Boolean(b.isFeatured),
    scheduledDate: null,
    readTime: b.banner?.readingTime || "",
    image: b.blogImage?.image || b.banner?.backgroundImage || "",
    imageAlt: b.blogImage?.alt || b.banner?.backgroundImageAlt || "",
    views: b.viewCount ?? 0,
    publishDate: b.banner?.date || b.createdAt,
    metaTitle: b.seo?.metaTitle || "",
    metaDescription: b.seo?.metaDescription || "",
    metaKeywords: b.seo?.metaKeywords || "",
    canonicalUrl: b.seo?.canonical || "",
    canonicalTag: b.seo?.canonical || "",
    ogTitle: og["og:title"] || "",
    ogDescription: og["og:description"] || "",
    ogImage: og["og:image"] || "",
    openGraphTags: b.seo?.ogJson || "",
    schemaMarkup: b.seo?.schema || "",
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
};

const readingTime = (html: string) => `${Math.max(1, Math.ceil(plain(html).split(" ").filter(Boolean).length / 200))} min read`;

/**
 * Editor fields → backend blog. Starts from the stored blog so sections the editor does not show
 * (CTA banner, expert, newsletter, author bio) are kept on update.
 */
const toEnsis = (data: Partial<BlogPostItem>, existing: EnsisBlog = {}): EnsisBlog => {
  const og = { ...readOg(existing.seo?.ogJson), ...readOg(data.openGraphTags) };
  if (data.ogTitle) og["og:title"] = data.ogTitle;
  if (data.ogDescription) og["og:description"] = data.ogDescription;
  if (data.ogImage) og["og:image"] = data.ogImage;
  const content = data.content ?? existing.article?.content ?? "";
  const image = data.image || existing.blogImage?.image || "";
  const tags = Array.isArray(data.tags) ? data.tags : typeof data.tags === "string" ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : existing.tags || [];
  const published = data.status ? data.status !== "draft" && data.status !== "archived" : existing.isActive !== false;
  const heading = (data.h1Title || data.title || "").trim();
  const keepBanner = Boolean(existing.banner?.title) && heading === [existing.banner?.title, existing.banner?.highlight].filter(Boolean).join(" ");

  return {
    title: data.title ?? existing.title,
    slug: data.slug ?? existing.slug,
    author: (data.author && data.author !== "Ensis Admin" ? data.author : existing.author) || data.author || "ENSIS",
    category: data.category ?? existing.category,
    tags,
    isActive: published,
    isFeatured: data.showOnHome ?? data.featured ?? existing.isFeatured ?? false,
    banner: {
      ...existing.banner,
      // An unchanged heading keeps its white/gold split; a new one goes in as the title
      ...(keepBanner ? {} : { title: heading || existing.banner?.title, highlight: "" }),
      // An edit keeps the original publish date (the editor sends "now" on every save)
      date: existing.banner?.date || (data.publishDate ? new Date(data.publishDate).toISOString() : new Date().toISOString()),
      readingTime: data.readTime && data.readTime !== "4 min read" ? data.readTime : readingTime(content),
      category: data.category ?? existing.banner?.category,
      backgroundImage: existing.banner?.backgroundImage || image,
      backgroundImageAlt: existing.banner?.backgroundImageAlt || data.imageAlt,
    },
    blogImage: { ...existing.blogImage, image, alt: data.imageAlt || existing.blogImage?.alt || "" },
    article: { ...existing.article, content },
    seo: {
      ...existing.seo,
      metaTitle: data.metaTitle ?? existing.seo?.metaTitle,
      metaDescription: data.metaDescription ?? existing.seo?.metaDescription,
      metaKeywords: data.metaKeywords ?? existing.seo?.metaKeywords,
      canonical: data.canonicalUrl || data.canonicalTag || existing.seo?.canonical,
      ogJson: Object.keys(og).length ? JSON.stringify(og, null, 2) : existing.seo?.ogJson,
      schema: data.schemaMarkup ?? existing.seo?.schema,
    },
  };
};

export const blogsApi = {
  /** All posts, drafts included (filters run here; the list is small) */
  list: async (params?: { status?: string; category?: string; search?: string; limit?: number }): Promise<GetBlogsResponse> => {
    const rows = await api.get<EnsisBlog[]>("/blogs?all=1");
    let posts = (Array.isArray(rows) ? rows : []).map(toItem);
    if (params?.status) posts = posts.filter((p) => p.status === params.status);
    if (params?.category) posts = posts.filter((p) => p.category === params.category);
    if (params?.search) {
      const q = params.search.toLowerCase();
      posts = posts.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (params?.limit) posts = posts.slice(0, params.limit);
    return { posts, total: posts.length, page: 1, totalPages: 1 };
  },

  getByIdOrSlug: async (idOrSlug: string): Promise<BlogPostItem> => {
    const blog = await api.get<EnsisBlog>(`/blogs/${encodeURIComponent(idOrSlug)}?admin=1`);
    return toItem(blog);
  },

  create: async (data: Partial<BlogPostItem>): Promise<BlogPostItem> => {
    const saved = await api.post<EnsisBlog>("/blogs", toEnsis(data));
    return toItem(saved);
  },

  update: async (id: string, data: Partial<BlogPostItem>): Promise<BlogPostItem> => {
    const existing = await api.get<EnsisBlog>(`/blogs/${encodeURIComponent(id)}?admin=1`);
    const saved = await api.put<EnsisBlog>(`/blogs/${existing?._id || id}`, toEnsis(data, existing || {}));
    return toItem(saved);
  },

  /** Publish / unpublish from the list without opening the editor */
  setPublished: async (id: string, published: boolean): Promise<BlogPostItem> => {
    const saved = await api.put<EnsisBlog>(`/blogs/${id}`, { isActive: published });
    return toItem(saved);
  },

  delete: (id: string) => {
    return api.delete<{ deleted: boolean }>(`/blogs/${id}`);
  },
};
