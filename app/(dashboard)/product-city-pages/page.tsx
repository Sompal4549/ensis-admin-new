"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPinned, Search } from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import CityPagesEditor, { normalizeCityPages, type CityPage } from "@/components/city-pages/CityPagesEditor";

type Product = { _id: string; title: string; slug: string; isActive: boolean; category?: { name?: string } | string; cities: CityPage[] };
type ProductList = { products: any[]; total: number };

const categoryName = (p: Product) => (typeof p.category === "object" && p.category?.name) || "";

export default function ProductCityPagesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const all: Product[] = [];
        for (let page = 1; page <= 20; page++) {
          const data = await api.get<ProductList>(`/products?page=${page}&limit=100&includeInactive=true`);
          all.push(
            ...(data?.products || []).map((p) => ({
              _id: p._id,
              // Titles can hold <br> for the storefront hero; the admin shows plain words
              title: String(p.title || p.slug).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
              slug: p.slug,
              isActive: p.isActive !== false,
              category: p.category,
              cities: normalizeCityPages(p.cities),
            }))
          );
          if (!data?.products?.length || all.length >= (data.total || 0)) break;
        }
        all.sort((a, b) => a.title.localeCompare(b.title));
        setProducts(all);
        setSelectedId(all.find((p) => p.cities.length)?._id || all[0]?._id || null);
      } catch (err) {
        Swal.fire({ title: "Could not load products", text: err instanceof Error ? err.message : "", icon: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.title.toLowerCase().includes(q) || categoryName(p).toLowerCase().includes(q)) : products;
  }, [products, query]);

  const selected = products.find((p) => p._id === selectedId) || null;
  const withCities = products.filter((p) => p.cities.length).length;

  const saveCities = async (cities: CityPage[]) => {
    if (!selected) return [];
    const saved = normalizeCityPages(await api.put<CityPage[]>(`/products/${selected._id}/cities`, { cities }));
    setProducts((list) => list.map((p) => (p._id === selected._id ? { ...p, cities: saved } : p)));
    return saved;
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="flex items-center gap-2 text-[19px] font-bold text-[#0f2a1c]">
          <MapPinned className="h-5 w-5 text-[#15633a]" /> Product City Pages
        </h1>
        <p className="text-[9px] text-[#64748b]">
          Create city landing pages for a product, e.g. “Panchkarma Droni in Mumbai” at /products/product-name/mumbai.{" "}
          {withCities ? `${withCities} product${withCities === 1 ? "" : "s"} have city pages.` : ""}
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-[9.5px] text-[#64748b]">Loading products…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="flex max-h-[75vh] flex-col gap-2 rounded-[8px] border border-[#e2e8f0] bg-white p-2">
            <label className="flex items-center gap-2 rounded-[6px] border border-[#dfe3e8] px-2">
              <Search className="h-4 w-4 text-[#94a3b8]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="h-[32px] flex-1 bg-transparent text-[9.5px] outline-none"
              />
            </label>
            <div className="flex flex-col gap-1 overflow-y-auto">
              {filtered.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setSelectedId(p._id)}
                  className={`flex items-center justify-between gap-2 rounded-[6px] px-3 py-2 text-left text-[9px] ${
                    p._id === selectedId ? "bg-[#e6f6ea] font-semibold text-[#14532d]" : "text-[#334155] hover:bg-[#f8fafc]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{p.title}</span>
                    {categoryName(p) && <span className="block truncate text-[8px] font-normal text-[#64748b]">{categoryName(p)}</span>}
                  </span>
                  {p.cities.length > 0 && (
                    <span className="shrink-0 rounded-full bg-[#e6f6ea] px-2 py-0.5 text-[8px] font-semibold text-[#15803d]">{p.cities.length}</span>
                  )}
                </button>
              ))}
              {!filtered.length && <p className="px-3 py-4 text-center text-[9px] text-[#64748b]">No products match.</p>}
            </div>
          </aside>

          {selected ? (
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center justify-between gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[#0f172a]">{selected.title}</p>
                  <p className="text-[8.5px] text-[#64748b]">
                    /products/{selected.slug} {selected.isActive ? "" : "· product is switched off, so its city pages are hidden too"}
                  </p>
                </div>
                {selected.isActive && (
                  <a
                    href={`${PUBLIC_SITE_URL}/products/${selected.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold text-[#2563eb]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View product
                  </a>
                )}
              </div>
              <CityPagesEditor
                key={selected._id}
                basePath={`/products/${selected.slug}`}
                parentTitle={selected.title}
                initial={selected.cities}
                onSave={saveCities}
                headingLabel="Page heading (shown above the specifications)"
                headingPlaceholder={(city) => `Best ${selected.title} in ${city}`}
              />
            </div>
          ) : (
            <p className="rounded-[8px] border border-dashed border-[#cbd5e1] py-10 text-center text-[9.5px] text-[#64748b]">Select a product.</p>
          )}
        </div>
      )}
    </div>
  );
}
