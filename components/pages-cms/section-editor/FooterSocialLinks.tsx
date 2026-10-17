import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { FieldLabel, TextInput, Toggle } from "../fields";

/** Platforms the website footer has icons for (Footer.tsx iconMap) */
const PLATFORMS = ["facebook", "instagram", "youtube", "linkedin", "whatsapp", "twitter"];

type SocialLink = { _id?: string; platform: string; url: string; isActive: boolean; order: number };

/**
 * The footer's social icons come from the SocialLink collection (/social-clicks/links),
 * not from layout.footer, so each row saves straight to that API.
 */
export function FooterSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<SocialLink[]>(`/social-clicks/links?t=${Date.now()}`)
      .then((list) => {
        if (!cancelled) setLinks(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) Swal.fire({ title: "Could not load social links", text: err instanceof Error ? err.message : "", icon: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (index: number, patch: Partial<SocialLink>) =>
    setLinks((prev) => prev.map((link, i) => (i === index ? { ...link, ...patch } : link)));

  const save = async (index: number) => {
    const link = links[index];
    if (!link.platform || !link.url.trim()) {
      Swal.fire({ title: "Platform and URL are required", icon: "warning" });
      return;
    }
    setSavingIndex(index);
    try {
      const payload = { platform: link.platform, url: link.url.trim(), isActive: link.isActive, order: Number(link.order) || 0 };
      const saved = link._id
        ? await api.put<SocialLink>(`/social-clicks/links/${link._id}`, payload)
        : await api.post<SocialLink>("/social-clicks/links", payload);
      update(index, saved);
      Swal.fire({ title: "Social link saved", icon: "success", timer: 1100, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Could not save social link", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setSavingIndex(null);
    }
  };

  const remove = async (index: number) => {
    const link = links[index];
    if (link._id) {
      const { isConfirmed } = await Swal.fire({
        title: `Remove ${link.platform}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Remove",
        confirmButtonColor: "#dc2626",
      });
      if (!isConfirmed) return;
      try {
        await api.delete(`/social-clicks/links/${link._id}`);
      } catch (err) {
        Swal.fire({ title: "Could not remove social link", text: err instanceof Error ? err.message : "", icon: "error" });
        return;
      }
    }
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const usedPlatforms = new Set(links.map((l) => l.platform));
  const nextPlatform = PLATFORMS.find((p) => !usedPlatforms.has(p));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[9.5px] font-semibold text-[#64748b]">
        Each social link saves on its own with its Save button (not with the page&apos;s Save).
      </p>
      {loading && <p className="text-[10px] font-semibold text-[#64748b]">Loading social links…</p>}
      {links.map((link, index) => (
        <div key={link._id || `new-${index}`} className="grid items-end gap-2 rounded-[6px] border border-[#eef1f4] bg-[#fbfbfa] p-2 md:grid-cols-[130px_1fr_70px_auto_auto]">
          <div>
            <FieldLabel>Platform</FieldLabel>
            <select
              value={link.platform}
              onChange={(e) => update(index, { platform: e.target.value })}
              className="h-[34px] w-full rounded-[5px] border border-[#dfe4e8] bg-white px-2 text-[10.5px] font-semibold capitalize text-[#2f3d58] outline-none"
            >
              {PLATFORMS.filter((p) => p === link.platform || !usedPlatforms.has(p)).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Profile URL</FieldLabel>
            <TextInput value={link.url} onChange={(next) => update(index, { url: next })} placeholder="https://instagram.com/ensis" hideLimit />
          </div>
          <div>
            <FieldLabel>Order</FieldLabel>
            <TextInput value={String(link.order ?? 0)} onChange={(next) => update(index, { order: Number(next.replace(/\D/g, "")) || 0 })} hideLimit />
          </div>
          <label className="flex h-[34px] items-center gap-2 text-[10px] font-semibold text-[#233D4D]">
            <Toggle checked={link.isActive} onChange={(value) => update(index, { isActive: value })} />
            Show
          </label>
          <div className="flex h-[34px] items-center gap-1">
            <button
              type="button"
              disabled={savingIndex === index}
              onClick={() => save(index)}
              className="inline-flex h-[30px] items-center gap-1 rounded-[5px] bg-[#1e40af] px-[10px] text-[10px] font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-60"
            >
              <Save className="h-[12px] w-[12px]" />
              Save
            </button>
            <button type="button" title="Remove" onClick={() => remove(index)} className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-rose-200 bg-white text-rose-500 hover:bg-rose-50">
              <Trash2 className="h-[12px] w-[12px]" />
            </button>
          </div>
        </div>
      ))}
      {nextPlatform && (
        <button
          type="button"
          onClick={() => setLinks((prev) => [...prev, { platform: nextPlatform, url: "", isActive: true, order: prev.length + 1 }])}
          className="inline-flex h-[32px] w-fit items-center gap-[6px] rounded-[5px] border border-dashed border-[#93c5fd] bg-white px-[12px] text-[10px] font-bold text-[#1e40af] hover:bg-blue-50"
        >
          <Plus className="h-[12px] w-[12px]" />
          Add Social Link
        </button>
      )}
    </div>
  );
}
