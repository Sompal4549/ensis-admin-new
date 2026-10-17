"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ManageBlogCategoriesView from "@/components/blogs/ManageBlogCategoriesView";
import typography from "../pages/PagesTypography.module.css";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  FileText,
  FolderClosed,
  Info,
  Megaphone,
  MessageCircleMore,
  MoreVertical,
  Pencil,
  Plus,
  Share2,
  Tag,
  ExternalLink,
  Trash2,
  UsersRound,
} from "lucide-react";
import Swal from "sweetalert2";
import { blogsApi, type BlogPostItem, type GetBlogsResponse } from "@/lib/blogsApi";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";

type PostStatus = "Published" | "Draft" | "Scheduled";
type PostCategory = "Wellness" | "Guides" | "Trends" | "Industry Insights";

type BlogPost = {
  id: number | string;
  _id?: string;
  title: string;
  category: string;
  status: PostStatus;
  views: number | null;
  date: string | null;
  dateTime?: string | null;
  /** Publish date, for "this month" counts */
  createdAt?: string;
  author?: string;
  image: string;
  slug?: string;
  showOnHome?: boolean;
};

const toneClass = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
} as const;


export default function BlogAwarenessPage() {
  const router = useRouter();
  const [showCategories, setShowCategories] = useState(false);
  const [postsList, setPostsList] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchPosts = () => {
    setLoading(true);
    setLoadError("");
    blogsApi
      .list()
      .then((res: GetBlogsResponse) => {
        const mapped: BlogPost[] = (res?.posts || []).map((p: BlogPostItem) => {
          const rawDate = p.updatedAt || p.publishDate || p.createdAt;
          const dateObj = rawDate ? new Date(rawDate) : null;
          const datePart = dateObj
            ? dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "—";
          const timePart = dateObj ? dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
          return {
            id: p._id || p.slug,
            _id: p._id,
            title: p.title,
            category: p.category || "",
            status: p.status === "published" ? "Published" : p.status === "scheduled" ? "Scheduled" : "Draft",
            views: p.views ?? 0,
            date: datePart,
            dateTime: dateObj ? `${datePart}, ${timePart}` : null,
            createdAt: p.publishDate ? String(p.publishDate) : p.createdAt,
            author: p.author || "",
            image: p.image || "",
            slug: p.slug,
            showOnHome: Boolean(p.showOnHome),
          };
        });
        setPostsList(mapped);
      })
      .catch((err: unknown) => {
        setPostsList([]);
        setLoadError(err instanceof Error ? err.message : "Could not load blog posts.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTogglePublish = async (post: BlogPost) => {
    const publish = post.status !== "Published";
    try {
      await blogsApi.setPublished(String(post._id || post.id), publish);
      setPostsList((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: publish ? "Published" : "Draft" } : p)));
    } catch (err) {
      Swal.fire({ icon: "error", title: "Not saved", text: err instanceof Error ? err.message : "Please try again." });
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    const result = await Swal.fire({
      title: "Delete Blog Post?",
      text: "Are you sure you want to permanently delete this blog post?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete",
    });

    if (result.isConfirmed) {
      try {
        await blogsApi.delete(String(postId));
      } catch (err) {
        Swal.fire({ icon: "error", title: "Not deleted", text: err instanceof Error ? err.message : "Please try again." });
        return;
      }
      setPostsList((prev) =>
        prev.filter((p) => String(p.id) !== String(postId) && String(p._id) !== String(postId))
      );
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Blog post removed successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const recentPosts = postsList;
  const mostViewed = useMemo(() => [...postsList].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5), [postsList]);

  const stats = useMemo(() => {
    const total = postsList.length;
    const published = postsList.filter((p) => p.status === "Published").length;
    const drafts = postsList.filter((p) => p.status === "Draft").length;
    const views = postsList.reduce((acc, p) => acc + (p.views || 0), 0);
    const onHome = postsList.filter((p) => p.showOnHome).length;
    const now = new Date();
    const thisMonth = postsList.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const categories = new Set(postsList.map((p) => p.category).filter(Boolean)).size;
    return { total, published, drafts, views, onHome, thisMonth, categories };
  }, [postsList]);

  const statCards = useMemo(
    () => [
      {
        title: "TOTAL POSTS",
        value: stats.total,
        suffix: "",
        icon: FileText,
        tone: "emerald" as const,
        gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #bbf7d0 100%)",
        borderColor: "#bbf7d0",
        numColor: "#15803d",
        footer: `Pub: ${stats.published} | Draft: ${stats.drafts}`,
      },
      {
        title: "PUBLISHED POSTS",
        value: stats.published,
        suffix: "",
        icon: Check,
        tone: "teal" as const,
        gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #99f6e4 100%)",
        borderColor: "#99f6e4",
        numColor: "#0f766e",
        footer: "Live on website",
      },
      {
        title: "TOTAL VIEWS",
        value: stats.views,
        suffix: "",
        icon: Eye,
        tone: "blue" as const,
        gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #bae6fd 100%)",
        borderColor: "#bae6fd",
        numColor: "#0284c7",
        footer: "Across all posts",
      },
      {
        title: "DRAFTS",
        value: stats.drafts,
        suffix: "",
        icon: Pencil,
        tone: "violet" as const,
        gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #ddd6fe 100%)",
        borderColor: "#ddd6fe",
        numColor: "#6d28d9",
        footer: "Hidden from website",
      },
      {
        title: "FEATURED ON HOME",
        value: stats.onHome,
        suffix: "",
        icon: Tag,
        tone: "amber" as const,
        gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #fed7aa 100%)",
        borderColor: "#fed7aa",
        numColor: "#c2410c",
        footer: "Shown on the home page",
      },
    ],
    [stats]
  );

  if (showCategories) {
    return <ManageBlogCategoriesView onBack={() => setShowCategories(false)} />;
  }

  return (
    <main
      className={`${typography.pages} h-full min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#fffefb] px-[18px] py-[14px] text-[#142347] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300`}
    >
      <div className="min-h-full w-full">
        {/* TOP HEADING — Matching Exhibitor List / Staff Style */}
        <div className="mb-[18px] flex shrink-0 items-center justify-between border-b-[2px] border-[#293681] pb-[8px]">
          <div>
            <h1
              className="text-[19px] font-bold leading-[1.15] tracking-[-0.018em] text-[#23471d]"
              style={{ color: "#23471d" }}
            >
              Blog &amp; Awareness
            </h1>
            <p className="mt-0.5 text-[9px] font-medium text-[#6c7587]">
              Super Admin only — defines what every internal role can see and do.
            </p>
          </div>

          <div className="flex items-center gap-[10px]">
            <Link
              href="/blogs/categories"
              onClick={(e) => {
                e.preventDefault();
                setShowCategories(true);
              }}
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#fed7aa] bg-[#fff7ed] px-[14px] text-[8.5px] font-semibold text-[#ea580c] transition hover:bg-[#ffedd5] shadow-sm"
            >
              <FolderClosed className="h-[12px] w-[12px] text-[#ea580c]" strokeWidth={1.7} />
              Manage Categories
            </Link>

            <Link
              href="/blogs/experts"
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#bbf7d0] bg-[#f0fdf4] px-[14px] text-[8.5px] font-semibold text-[#15803d] transition hover:bg-[#dcfce7] shadow-sm"
            >
              <UsersRound className="h-[12px] w-[12px] text-[#15803d]" strokeWidth={1.7} />
              Manage Experts
            </Link>

            <Link
              href="/blogs/updates"
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#bfdbfe] bg-[#eff6ff] px-[14px] text-[8.5px] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] shadow-sm"
            >
              <Megaphone className="h-[12px] w-[12px] text-[#1d4ed8]" strokeWidth={1.7} />
              Manage Updates
            </Link>

            <Link
              href="/blogs/reports"
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#e9d5ff] bg-[#faf5ff] px-[14px] text-[8.5px] font-semibold text-[#7e22ce] transition hover:bg-[#f3e8ff] shadow-sm"
            >
              <FileText className="h-[12px] w-[12px] text-[#7e22ce]" strokeWidth={1.7} />
              Manage Reports
            </Link>

            <button
              type="button"
              onClick={() => router.push("/blogs/new")}
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] bg-[#075b33] px-[14px] text-[8.5px] font-semibold text-white shadow-[0_5px_12px_rgba(7,91,51,0.25)] transition hover:bg-[#054626]"
            >
              <Plus className="h-[12px] w-[12px]" strokeWidth={1.7} />
              Add New Post
            </button>
          </div>
        </div>

        {/* METRIC STATS CARDS (Matching Exhibitor List KPI Style — 5 Cards) */}
        <div className="mt-[12px] grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="relative flex h-[98px] flex-col overflow-hidden rounded-[11px] border border-[#e5e7e6] bg-white p-2 !pb-5.5 transition-all hover:translate-y-[-1px]"
                style={{
                  background: item.gradient,
                  borderColor: item.borderColor || undefined,
                  boxShadow:
                    "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
                }}
              >
                <div className="flex items-start gap-1.5">
                  <div
                    className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full ring-1 bg-white/80 shadow-xs ${
                      toneClass[item.tone as keyof typeof toneClass]
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[8.5px] !font-semibold tracking-[0.01em] text-slate-900"
                      style={{
                        fontWeight: 600,
                        color: "#0f172a",
                      }}
                    >
                      {item.title}
                    </p>

                    <div className="mt-1.5 flex items-end gap-1">
                      <span
                        className="text-[21px] !font-semibold leading-none tracking-[-0.04em]"
                        style={{
                          color: item.numColor,
                          fontWeight: 600,
                        }}
                      >
                        <AnimatedCounter value={item.value} />
                      </span>

                      {item.suffix && (
                        <span className="mb-0.5 text-[9.5px] font-bold text-emerald-700">
                          {item.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1 left-2 right-2 flex cursor-pointer items-center justify-center gap-1 text-[8px] font-semibold text-[#293957] transition hover:text-blue-600">
                  {item.footer}
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>

        {/* MAIN TWO COLUMN SECTION: RECENT BLOG POSTS + CAMPAIGNS */}
        <div className="mt-[14px] grid items-start gap-[14px] xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
          {/* RECENT BLOG POSTS TABLE (Matching Exhibitor List Table View) */}
          <section
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[7px] bg-white border border-[#e8e5df]"
            style={{
              boxShadow:
                "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
            }}
          >
            {/* Card Header */}
            <div className="flex h-[38px] items-center justify-between border-b border-[#e8e5df] px-[14px] bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <span className="grid h-[22px] w-[22px] place-items-center rounded-[4px] bg-[#075b33] text-white">
                  <FileText className="h-[12px] w-[12px]" />
                </span>
                <h2 className="text-[10px] font-bold text-[#233D4D] uppercase tracking-wide">
                  Recent Blog Posts
                </h2>
              </div>
              <button
                onClick={() => router.push("/blogs")}
                className="inline-flex items-center gap-1 text-[8.5px] font-bold text-[#075b33] hover:underline"
              >
                View All Posts
                <ArrowRight className="h-[11px] w-[11px]" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="h-[32px] border-b border-[#e8e5df] bg-[#233D4D]">
                    <th className="px-[12px] py-[6px] text-[8.5px] font-bold text-white uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-[12px] py-[6px] whitespace-nowrap text-[8.5px] font-bold text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-[12px] py-[6px] whitespace-nowrap text-[8.5px] font-bold text-white uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-[12px] py-[6px] whitespace-nowrap text-[8.5px] font-bold text-white uppercase tracking-wider">
                      Updated By
                    </th>
                    <th className="rounded-tr-[6px] px-[12px] py-[6px] text-right text-[8.5px] font-bold text-white uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0f0ec]">
                  {(loading || loadError || recentPosts.length === 0) && (
                    <tr>
                      <td colSpan={5} className={`px-[12px] py-[22px] text-center text-[9px] font-semibold ${loadError ? "text-red-600" : "text-slate-500"}`}>
                        {loading ? "Loading blog posts…" : loadError ? `Could not load posts: ${loadError}` : "No blog posts yet. Click “Add New Post” to write one."}
                      </td>
                    </tr>
                  )}
                  {!loading && recentPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="transition hover:bg-slate-50/80 cursor-pointer"
                    >
                      {/* Title + Thumbnail */}
                      <td className="px-[12px] py-[8px]">
                        <div className="flex min-w-[260px] items-center gap-[10px]">
                          <div className="relative flex h-[36px] w-[54px] shrink-0 items-center justify-center rounded-[4px] border border-[#e4e7eb] bg-white p-0.5 shadow-xs overflow-hidden">
                            {post.image ? <img
                              src={post.image}
                              alt={post.title}
                              className="h-full w-full object-cover rounded-[3px]"
                            /> : <FileText className="h-[14px] w-[14px] text-slate-400" />}
                          </div>
                          <div className="min-w-0 overflow-hidden">
                            <span className="truncate text-[8.5px] font-semibold text-[#233D4D] block hover:text-[#075b33] transition">
                              {post.title}
                            </span>
                            <div className="flex items-center gap-1 mt-[2px]">
                              <span className="inline-block rounded-[3px] bg-[#f0f4f8] px-[5px] py-[1px] font-mono text-[7px] font-semibold text-[#233D4D]">
                                ID #{String(post._id || post.id).slice(-6)}
                              </span>
                              {post.category && (
                                <span className="inline-block rounded-[3px] bg-slate-100 border border-slate-200 text-slate-700 px-[4px] py-[1px] text-[7px] font-semibold">
                                  {post.category}
                                </span>
                              )}
                              {post.showOnHome && (
                                <span className="inline-block rounded-[3px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-[4px] py-[1px] text-[7px] font-bold">
                                  🏠 Home
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-[12px] py-[8px] whitespace-nowrap">
                        <button
                          type="button"
                          title={post.status === "Published" ? "Click to unpublish (hide from website)" : "Click to publish on website"}
                          onClick={() => handleTogglePublish(post)}
                          className={`inline-flex items-center rounded-[4px] px-[8px] py-[2px] text-[7.5px] font-bold shadow-xs transition hover:opacity-80 ${
                            post.status === "Published"
                              ? "bg-[#e8f5e9] text-[#23714a] border border-[#a5d6a7]"
                              : post.status === "Scheduled"
                              ? "bg-[#fef3c7] text-[#b45309] border border-[#fde68a]"
                              : "bg-[#ffebee] text-[#c62828] border border-[#ef9a9a]"
                          }`}
                        >
                          {post.status === "Scheduled" ? "⏰ Scheduled" : post.status}
                        </button>
                      </td>

                      {/* Views */}
                      <td className="px-[12px] py-[8px] whitespace-nowrap">
                        <span className="text-[8px] font-semibold text-[#293681]">
                          {post.views ? post.views.toLocaleString() : "—"}
                        </span>
                      </td>

                      {/* Updated By */}
                      <td className="px-[12px] py-[8px] whitespace-nowrap">
                        <div className="flex flex-col gap-[2px]">
                          <span className="text-[7.5px] font-semibold text-[#1e293b] leading-tight">
                            {post.dateTime || post.date || "—"}
                          </span>
                          <span className="text-[7px] font-medium text-[#075b33] flex items-center gap-[3px]">
                            <span>👤</span>
                            {post.author || "Admin"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-[12px] py-[8px] text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="View Post on Website"
                            onClick={() =>
                              window.open(
                                post.slug ? `${PUBLIC_SITE_URL}/blog/${post.slug}` : `${PUBLIC_SITE_URL}/blog`,
                                "_blank"
                              )
                            }
                            className="flex h-[25px] w-[25px] items-center justify-center rounded-[6px] bg-orange-500/10 text-orange-600 backdrop-blur-md border border-orange-400/30 shadow-[0_2px_6px_rgba(249,115,22,0.12)] transition-all hover:bg-orange-500/20 hover:border-orange-400/50 hover:shadow-[0_3px_10px_rgba(249,115,22,0.25)] hover:scale-105 active:scale-95"
                          >
                            <Eye className="h-[12px] w-[12px] text-orange-600" />
                          </button>

                          <button
                            type="button"
                            title="Edit Post"
                            onClick={() => router.push(`/blogs/new?id=${post._id || post.id}`)}
                            className="flex h-[25px] w-[25px] items-center justify-center rounded-[6px] bg-blue-500/10 text-blue-600 backdrop-blur-md border border-blue-400/30 shadow-[0_2px_6px_rgba(37,99,235,0.12)] transition-all hover:bg-blue-500/20 hover:border-blue-400/50 hover:shadow-[0_3px_10px_rgba(37,99,235,0.25)] hover:scale-105 active:scale-95"
                          >
                            <Pencil className="h-[12px] w-[12px] text-blue-600" />
                          </button>

                          <button
                            type="button"
                            title="Delete Post"
                            onClick={() => handleDeletePost(post._id || post.id)}
                            className="flex h-[25px] w-[25px] items-center justify-center rounded-[6px] bg-red-500/10 text-red-600 backdrop-blur-md border border-red-400/30 shadow-[0_2px_6px_rgba(239,68,68,0.12)] transition-all hover:bg-red-500/20 hover:border-red-400/50 hover:scale-105 active:scale-95"
                          >
                            <Trash2 className="h-[12px] w-[12px] text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8e5df] bg-[#fafafa] px-[12px] py-[6px] text-[8px]">
              <span className="font-semibold text-[#2563eb]">
                Total Posts: <strong className="font-bold text-[#1d4ed8]">{stats.total}</strong>
              </span>
              <button
                onClick={fetchPosts}
                className="inline-flex items-center gap-1 font-bold text-[#075b33] hover:underline"
              >
                Refresh <ArrowRight className="h-[11px] w-[11px]" />
              </button>
            </div>
          </section>

          {/* AWARENESS CAMPAIGNS CARD */}
          <section
            className="flex min-h-0 flex-col overflow-hidden rounded-[7px] bg-white border border-[#e8e5df]"
            style={{
              boxShadow:
                "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
            }}
          >
            {/* Card Header */}
            <div className="flex h-[38px] items-center justify-between border-b border-[#e8e5df] px-[14px] bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <span className="grid h-[22px] w-[22px] place-items-center rounded-[4px] bg-[#0284c7] text-white">
                  <Eye className="h-[12px] w-[12px]" />
                </span>
                <h2 className="text-[10px] font-bold text-[#233D4D] uppercase tracking-wide">
                  Most Viewed Posts
                </h2>
              </div>
              <span className="text-[7.5px] font-semibold text-[#6c7587]">Top 5 by views</span>
            </div>

            <div className="divide-y divide-[#f0f0ec] px-[12px]">
              {mostViewed.length === 0 && (
                <p className="py-[18px] text-center text-[8.5px] font-semibold text-slate-500">
                  {loading ? "Loading…" : "No posts yet."}
                </p>
              )}
              {mostViewed.map((post, index) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => router.push(`/blogs/new?id=${post._id || post.id}`)}
                  className="grid min-h-[50px] w-full grid-cols-[28px_minmax(0,1fr)_auto_16px] items-center gap-[10px] py-[6px] text-left transition hover:bg-slate-50/80"
                >
                  <div className="grid h-[28px] w-[28px] place-items-center rounded-[6px] bg-sky-50 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200/60">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[8.5px] font-semibold text-[#19274a]">{post.title}</p>
                    <p className="mt-[2px] whitespace-nowrap text-[7.5px] font-medium text-[#68758d]">
                      {post.category || "Uncategorised"} · {post.status}
                    </p>
                  </div>

                  <span className="rounded-[4px] border border-[#bae6fd] bg-[#f0f9ff] px-[8px] py-[2px] text-[7.5px] font-bold text-[#0369a1]">
                    {(post.views || 0).toLocaleString("en-IN")} views
                  </span>

                  <ChevronRight className="h-[12px] w-[12px] text-[#8c98a9]" />
                </button>
              ))}
            </div>

            <div className="border-t border-[#e8e5df] bg-[#fafafa] px-[12px] py-[6px]">
              <button
                onClick={() => router.push("/blogs/new")}
                className="flex h-[28px] w-full items-center justify-center gap-1.5 rounded-[5px] border border-[#fed7aa] bg-[#fff7ed] text-[8.5px] font-bold text-[#ea580c] transition hover:bg-[#ffedd5] shadow-2xs"
              >
                <Plus className="h-[12px] w-[12px]" strokeWidth={1.8} />
                Write New Post
              </button>
            </div>
          </section>
        </div>

        {/* QUICK ACTIONS & CONTENT INSIGHTS SECTION */}
        <div className="mt-[14px] grid items-stretch gap-[14px] xl:grid-cols-[minmax(360px,0.78fr)_minmax(0,1fr)]">
          {/* QUICK ACTIONS */}
          <section
            className="flex flex-col justify-between rounded-[7px] bg-white border border-[#e8e5df] p-[14px]"
            style={{
              boxShadow:
                "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
            }}
          >
            <div className="flex items-center justify-between border-b border-[#e8e5df] pb-2">
              <h2 className="text-[10px] font-bold text-[#233D4D] uppercase tracking-wide">
                Quick Actions
              </h2>
              <span className="text-[7.5px] font-semibold text-[#6c7587]">Fast Shortcuts</span>
            </div>

            <div className="mt-[12px] grid grid-cols-5 gap-[10px]">
              {[
                [Pencil, "Add New Post"],
                [Megaphone, "Add New Campaign"],
                [FolderClosed, "Manage Categories"],
                [Tag, "Manage Tags"],
                [MessageCircleMore, "View Comments"],
              ].map(([Icon, label]) => {
                const ActionIcon = Icon as typeof Pencil;

                return (
                  <button
                    key={String(label)}
                    onClick={() => {
                      if (label === "Manage Categories") {
                        setShowCategories(true);
                      } else if (label === "Add New Post") {
                        router.push("/blogs/new");
                      }
                    }}
                    className="group min-w-0 text-center transition hover:-translate-y-0.5"
                  >
                    <div className="mx-auto grid h-[50px] w-[50px] place-items-center rounded-[8px] border border-[#dce8df] bg-[linear-gradient(180deg,#eef7f1_0%,#f7faf8_100%)] text-[#14683d] shadow-2xs group-hover:border-[#075b33] group-hover:bg-[#e8f5e9]">
                      <ActionIcon className="h-[20px] w-[20px]" strokeWidth={1.8} />
                    </div>
                    <span className="mt-[6px] block text-[7.5px] font-semibold leading-[1.3] text-[#293854]">
                      {String(label)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* CONTENT INSIGHTS */}
          <section
            className="flex flex-col justify-between rounded-[7px] bg-white border border-[#e8e5df] p-[14px]"
            style={{
              boxShadow:
                "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
            }}
          >
            <div className="flex items-center justify-between border-b border-[#e8e5df] pb-2">
              <h2 className="text-[10px] font-bold text-[#233D4D] uppercase tracking-wide">
                Content Insights
              </h2>
              <span className="text-[7.5px] font-semibold text-emerald-700 font-mono">Live from the website</span>
            </div>

            <div className="mt-[12px] grid grid-cols-4 gap-[12px]">
              {[
                {
                  icon: <FileText className="h-[18px] w-[18px]" />,
                  tone: "emerald" as const,
                  value: String(stats.thisMonth),
                  label: "Posts This Month",
                  note: "Published this calendar month",
                  numColor: "#15803d",
                },
                {
                  icon: <Eye className="h-[18px] w-[18px]" />,
                  tone: "blue" as const,
                  value: stats.views.toLocaleString("en-IN"),
                  label: "Total Post Views",
                  note: "All-time, all posts",
                  numColor: "#0284c7",
                },
                {
                  icon: <FolderClosed className="h-[18px] w-[18px]" />,
                  tone: "violet" as const,
                  value: String(stats.categories),
                  label: "Categories Used",
                  note: "Across all posts",
                  numColor: "#6d28d9",
                },
                {
                  icon: <Check className="h-[18px] w-[18px]" />,
                  tone: "amber" as const,
                  value: String(stats.published),
                  label: "Live on Website",
                  note: stats.drafts + " draft(s) hidden",
                  numColor: "#c2410c",
                },
              ].map((item) => (
                <div key={item.label} className="flex min-w-0 items-start gap-[8px]">
                  <div
                    className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full ring-1 bg-white/80 shadow-xs ${
                      toneClass[item.tone]
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="text-[17px] font-bold leading-none tracking-tight"
                      style={{ color: item.numColor }}
                    >
                      {item.value}
                    </p>
                    <p className="mt-[3px] text-[7.5px] font-semibold leading-[1.25] text-[#34425e]">
                      {item.label}
                    </p>
                    <p className="mt-[4px] text-[7px] font-semibold text-emerald-700">
                      {item.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* BOTTOM HELPFUL TIP STRIP (Matching Exhibitor Section Edit Bar tone) */}
        <section className="mt-[14px] flex items-center gap-2.5 rounded-[6px] border border-[#cbe2fc] bg-[#f0f7ff] p-[10px] px-[14px]">
          <span className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-[5px] bg-[#0284c7] text-white">
            <Info className="h-[14px] w-[14px]" />
          </span>
          <div>
            <p className="text-[8.5px] font-medium text-[#0369a1]">
              <strong className="font-bold text-[#0284c7]">Pro Tip:</strong> Consistent blogging and awareness campaigns significantly improve SEO organic reach, visitor trust, and participant conversions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}