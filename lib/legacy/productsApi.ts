import { api, getBackendUrl } from "@/lib/api";
import { uploadApi } from "@/lib/uploadApi";

/*
 * Products admin, ported from the original Ensis admin (ensis-admin-backup). These keep that
 * page's API shape but go through this admin's signed-in `api` client.
 */

export type Category = {
  _id: string;
  name: string;
  image?: string;
};

export type Product = {
  _id: string;
  title: string;
  slug: string;
  code?: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  gstRate?: number;
  category?: Category | string;
  subcategory?: string;
  material?: string;
  weight?: string;
  images?: string[];
  stock?: number;
  tags?: string[];
  averageRating?: number;
  reviews?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  updatedAt?: string;
  orderBy?: number;
  overview?: {
    title?: string;
    description?: string;
    overviewList?: string[];
    seeItInRealSpaces?: { title: string; images: { image: string; imageAlt: string }[] };
    productPricingFeatures?: { title: string; image: string }[];
    emiOptions?: boolean;
    customSize?: boolean;
    specifications?: { title: string; specificationsList: { title: string; description: string }[] };
    keyFeatures?: { title: string; keyFeaturesList: string[] };
    idealFor?: string;
    dimensions?: { title: string; dimensionsList: { title: string; description: string }[] };
    materialAndCare?: { title: string; description: string };
    productSpecifications?: { highlight: string; title: string; image: string; specifications: { title: string; description: string }[] }[];
    whatisInclueded?: string[];
    items?: { image: string; title: string; description: string }[];
    smartDesignAppearance?: {
      highlight?: string;
      title?: string;
      woodFinish?: { image: string; title: string }[];
      sizeOptions?: { title: string; description: string }[];
    };
    faqs?: { question: string; description: string }[];
  };
};

export type ProductBackup = {
  _id: string;
  productId: string;
  backedUpAt: string;
  note?: string;
  snapshot?: Record<string, unknown>;
};

type ProductList = { products: Product[]; total: number; page: number; limit: number };

/** Every page of products (the API caps each page at 100) */
const listAll = async (query: string): Promise<ProductList> => {
  const products: Product[] = [];
  let total = 0;
  for (let page = 1; page <= 50; page++) {
    const data = await api.get<ProductList>(`/products?limit=100&page=${page}&sortBy=orderBy&order=asc&${query}&t=${Date.now()}`);
    products.push(...(data?.products || []));
    total = data?.total || products.length;
    if (!data?.products?.length || products.length >= total) break;
  }
  return { products, total, page: 1, limit: products.length };
};

export const categoryApi = {
  // all=1: hidden categories too, so editing a product never loses its category
  list: () => api.get<Category[]>(`/categories?all=1&t=${Date.now()}`),
};

export const productApi = {
  list: () => listAll("includeInactive=true"),
  listDeleted: () => listAll("deleted=true"),
  create: (payload: Partial<Product>) => api.post<Product>("/products", payload),
  update: (id: string, payload: Partial<Product>) => api.put<Product>(`/products/${id}`, payload),
  remove: (id: string) => api.delete<null>(`/products/${id}`),
  restore: (id: string) => api.post<Product>(`/products/${id}/restore`),
  permanentDelete: (id: string) => api.delete<null>(`/products/${id}/permanent`),
};

export const productBackupApi = {
  list: (productId: string) => api.get<ProductBackup[]>(`/products/${productId}/backups?t=${Date.now()}`),
  create: (productId: string, note?: string) => api.post<ProductBackup>(`/products/${productId}/backups`, { note }),
  get: (backupId: string) => api.get<ProductBackup>(`/products/backups/${backupId}`),
  restore: (backupId: string) => api.post<Product>(`/products/backups/${backupId}/restore`),
  remove: (backupId: string) => api.delete<null>(`/products/backups/${backupId}`),
  removeAll: (productId: string) => api.delete<null>(`/products/${productId}/backups`),
};

/** Full URL for a stored image path (/uploads/... is served by the backend) */
export const getImageUrl = (image?: string) => {
  if (!image || typeof image !== "string") return "";
  if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) return image;
  if (!image.startsWith("/uploads")) return image;
  return `${getBackendUrl()}${image}`;
};

/** Uploads one image for a product and returns its URL */
export const uploadImage = async (file: File, subDir = "products") => {
  const res = await uploadApi.file(file, `ensis/${subDir || "products"}`);
  const url = res?.url || (res as { data?: { url?: string } })?.data?.url;
  if (!url) throw new Error("Upload did not return an image URL.");
  return url;
};

export const labelClass = "mb-1 block text-xs font-semibold text-text-primary tracking-wide";

export const fieldClass =
  "w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-text-muted transition-colors font-normal shadow-xs";
