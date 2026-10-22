/**
 * Building blocks copied from the Organic admin list pages (General Enquiries) so pages
 * added for Ensis look exactly like the rest of the admin: same header, stat cards,
 * filters, navy table head, pagination and right-hand summary cards.
 */
import type { ComponentType, CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, RefreshCcw, Search } from "lucide-react";
import typography from "@/app/(dashboard)/pages/PagesTypography.module.css";

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: CSSProperties }>;

const CARD_SHADOW = "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px";

export function OrganicPage({ children }: { children: ReactNode }) {
  return <div className={`${typography.pages} w-full min-w-0 bg-[#fffefb] text-[#182238] px-[18px] pb-[15px] pt-[14px]`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-[20px]">
      <div>
        {back && (
          <Link href={back.href} className="mb-[4px] inline-flex items-center gap-[4px] text-[10px] font-semibold text-[#475A83] hover:text-[#293681]">
            <ChevronLeft size={12} /> {back.label}
          </Link>
        )}
        <h1 className="flex flex-wrap items-center gap-[8px] text-[20px] font-semibold leading-[25px] tracking-[-0.35px] text-[#293681]">{title}</h1>
        {subtitle && <p className="mt-[2px] text-[10px] font-semibold leading-[16px] text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-[12px] pt-[2px]">{actions}</div>}
    </div>
  );
}

const outlineButton =
  "flex h-[36px] items-center gap-[8px] rounded-[5px] border border-[#E0E5EB] bg-white px-[15px] text-[10px] font-semibold text-[#172762] hover:bg-slate-50 transition disabled:opacity-50";
const primaryButton =
  "flex h-[36px] items-center gap-[8px] rounded-[5px] bg-[#293681] px-[17px] text-[10px] font-semibold text-white shadow-[0_2px_5px_rgba(0,95,46,0.14)] hover:bg-[#1f2a6b] transition disabled:opacity-60";

export function HeaderButton({ icon: Icon, children, onClick, href, primary, disabled, target }: { icon?: IconType; children: ReactNode; onClick?: () => void; href?: string; primary?: boolean; disabled?: boolean; target?: string }) {
  const className = primary ? primaryButton : outlineButton;
  const content = (
    <>
      {Icon && <Icon size={primary ? 15 : 14} />}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} target={target} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

export type StatTone = "violet" | "blue" | "amber" | "emerald" | "rose" | "slate";

const STAT_TONES: Record<StatTone, { gradient: string; toneClass: string; numColor: string; noteColor: string }> = {
  violet: { gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, #f8f5ff 100%)", toneClass: "bg-violet-50 text-violet-700 ring-violet-100", numColor: "#6d28d9", noteColor: "text-violet-700" },
  blue: { gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, #f0f7ff 100%)", toneClass: "bg-blue-50 text-blue-700 ring-blue-100", numColor: "#1d4ed8", noteColor: "text-blue-600" },
  amber: { gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, #fffdf0 100%)", toneClass: "bg-amber-50 text-amber-700 ring-amber-100", numColor: "#b45309", noteColor: "text-amber-600" },
  emerald: { gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, #f0fdf4 100%)", toneClass: "bg-emerald-50 text-emerald-700 ring-emerald-100", numColor: "#047857", noteColor: "text-emerald-700" },
  rose: { gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, #fff1f2 100%)", toneClass: "bg-rose-50 text-rose-700 ring-rose-100", numColor: "#be123c", noteColor: "text-rose-600" },
  slate: { gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 55%, #f8fafc 100%)", toneClass: "bg-slate-50 text-slate-700 ring-slate-100", numColor: "#0f172a", noteColor: "text-slate-600" },
};

export function StatCard({ label, value, note, icon: Icon, tone, onClick, active }: { label: string; value: ReactNode; note?: string; icon: IconType; tone: StatTone; onClick?: () => void; active?: boolean }) {
  const t = STAT_TONES[tone];
  const body = (
    <div className="flex items-start gap-1.5">
      <div className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full ring-1 ${t.toneClass}`}>
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[8px] tracking-[0.01em]" style={{ color: "#0f172a" }}>{label.toUpperCase()}</p>
        <div className="mt-1.5 flex items-end gap-1">
          <span className="truncate text-[17px] leading-none tracking-[-0.04em]" style={{ color: t.numColor }}>{value}</span>
        </div>
        {note && <p className={`mt-0.5 truncate text-[7.5px] font-bold ${t.noteColor}`}>{note}</p>}
      </div>
    </div>
  );
  const className = `relative flex flex-col justify-center overflow-hidden rounded-[7px] p-2 ${active ? "ring-2 ring-[#293681]" : ""}`;
  const style = { background: t.gradient, boxShadow: CARD_SHADOW };
  return onClick ? (
    <button type="button" onClick={onClick} className={className} style={style}>{body}</button>
  ) : (
    <div className={className} style={style}>{body}</div>
  );
}

export function StatGrid({ children, columns = 5 }: { children: ReactNode; columns?: number }) {
  return <div className="grid gap-[10px]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{children}</div>;
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mt-[14px] flex w-full min-w-0 items-center gap-[8px] overflow-x-auto pb-1">{children}</div>;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="flex h-[32px] min-w-[200px] flex-1 items-center gap-[8px] rounded-[6px] border border-[#e2e8f0] bg-white px-[11px]">
      <Search size={14} className="shrink-0 text-[#64748b]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-[10px] font-medium text-[#334155] outline-none placeholder:text-[#94a3b8]"
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[32px] w-full cursor-pointer appearance-none rounded-[6px] border border-[#e2e8f0] bg-white pl-[11px] pr-[26px] text-[10px] font-semibold text-[#334155] outline-none transition-colors hover:border-slate-300 focus:border-[#233D4D]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-[8px] top-1/2 h-[12px] w-[12px] -translate-y-1/2 text-[#64748b]" />
    </div>
  );
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[32px] shrink-0 cursor-pointer items-center justify-center gap-[5px] whitespace-nowrap rounded-[6px] border border-[#e2e8f0] bg-white px-[12px] text-[10px] font-semibold text-[#334155] transition hover:bg-slate-50"
    >
      <RefreshCcw size={12} className="shrink-0 text-[#64748b]" />
      Reset
    </button>
  );
}

/** Two-column layout: content + 285px right summary column, as on the Organic list pages */
export function MainWithSidebar({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  return (
    <div className="mt-[22px] grid min-w-0 gap-[16px] xl:grid-cols-[minmax(0,1fr)_285px]">
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      <aside className="min-w-0 space-y-[13px]">{sidebar}</aside>
    </div>
  );
}

export function TableCard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mt-[11px] w-full min-w-0 overflow-hidden rounded-[6px] border border-[#E2E6EB] bg-white" style={{ boxShadow: CARD_SHADOW }}>
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}

export const thClass = "px-[8px] text-[8.5px] font-bold uppercase tracking-wider text-white whitespace-nowrap";
export const theadRowClass = "h-[32px] border-b border-[#e8e5df] bg-[#233D4D] text-left text-white";
export const rowClass = "h-[56px] border-t border-[#E9ECF0] align-middle transition hover:bg-[#FAFBFC]";
export const cellPrimary = "truncate text-[8px] font-semibold text-[#293681]";
export const cellSecondary = "mt-[3px] truncate text-[7.5px] font-medium text-[#64748b]";
export const cellText = "text-[10px] font-semibold text-[#324374]";

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-[34px] text-center text-[10px] font-semibold text-[#667085]">{children}</td>
    </tr>
  );
}

export function LoadingRows({ colSpan, rows = 6 }: { colSpan: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={`loading-${index}`} className="h-[56px] border-t border-[#E9ECF0]">
          <td colSpan={colSpan} className="px-[10px]">
            <div className="h-[10px] w-full animate-pulse rounded bg-[#F1F3F5]" />
          </td>
        </tr>
      ))}
    </>
  );
}

/** Small coloured pill used for statuses (tone classes include bg, text and border) */
export function Pill({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-[4px] border px-[6px] py-[2px] text-[7px] font-semibold leading-none ${className}`}>{children}</span>;
}

export function Pagination({ page, pages, total, from, to, noun, onPage, perPage, onPerPage }: { page: number; pages: number; total: number; from: number; to: number; noun: string; onPage: (page: number) => void; perPage?: number; onPerPage?: (value: number) => void }) {
  const windowStart = Math.max(1, Math.min(page - 1, pages - 3));
  const numbers = Array.from({ length: Math.min(4, pages) }, (_, i) => windowStart + i);
  const navClass = "flex h-[27px] w-[27px] items-center justify-center rounded-[4px] border border-[#E3E7ED] bg-white text-[#536180] disabled:opacity-40";
  return (
    <div className="flex h-[49px] items-center justify-between gap-[10px] border-t border-[#E6E9ED] px-[16px]">
      <p className="whitespace-nowrap text-[10px] font-semibold text-[#475A83]">
        {total > 0 ? `Showing ${from} to ${to} of ${total} ${noun}` : `Showing 0 ${noun}`}
      </p>
      <div className="flex items-center gap-[5px]">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={navClass} aria-label="Previous page">
          <ChevronLeft size={12} />
        </button>
        {numbers.map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => onPage(n)}
            className={`flex h-[27px] w-[27px] items-center justify-center rounded-[4px] border text-[10px] font-semibold ${page === n ? "border-[#006132] bg-[#006132] text-white" : "border-[#E3E7ED] bg-white text-[#334575]"}`}
          >
            {n}
          </button>
        ))}
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className={navClass} aria-label="Next page">
          <ChevronRight size={12} />
        </button>
      </div>
      {onPerPage ? (
        <div className="relative">
          <select
            value={perPage}
            onChange={(e) => onPerPage(Number(e.target.value))}
            className="h-[28px] w-[94px] appearance-none rounded-[4px] border border-[#E3E3ED] bg-white px-[9px] pr-[25px] text-[10px] font-semibold text-[#536180] outline-none"
          >
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n} per page</option>)}
          </select>
          <ChevronDown size={9} className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2" />
        </div>
      ) : (
        <span className="w-[94px]" />
      )}
    </div>
  );
}

export function SideCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[7px] border border-[#e1e5ec] bg-white" style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px" }}>
      <div className="flex h-[32px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-[#f0f3f6] px-3">
        <h2 className="text-[11.5px] font-semibold tracking-[-0.01em] text-[#0f172a]">{title}</h2>
        {action}
      </div>
      <div className="px-[12px] pb-[14px] pt-[12px]">{children}</div>
    </div>
  );
}

export type DonutSlice = { label: string; value: number; color: string };

export function SummaryDonut({ slices, centerLabel = "TOTAL" }: { slices: DonutSlice[]; centerLabel?: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let start = 0;
  const stops = slices.map((s) => {
    const end = start + (total ? (s.value / total) * 100 : 0);
    const stop = `${s.color} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return (
    <div className="mt-[6px] flex items-center gap-[10px]">
      <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-full" style={{ background: total ? `conic-gradient(${stops.join(", ")})` : "#EDF0F3" }}>
        <div className="flex h-[66px] w-[66px] flex-col items-center justify-center rounded-full bg-white px-1 text-center">
          <span className="text-[17px] font-bold leading-none text-[#0f172a]">{total}</span>
          <span className="mt-[2.5px] text-[7.5px] font-bold uppercase tracking-wider text-[#475A83] whitespace-nowrap">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-[6px]">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-[6px] text-[10px] font-semibold text-[#334475]">
            <span className="flex min-w-0 items-center gap-[6px]">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="whitespace-nowrap">{s.value} ({total ? ((s.value / total) * 100).toFixed(1) : "0.0"}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SidebarBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-[8px]">
      <span className="truncate text-[10px] font-semibold text-[#334475]">{label}</span>
      <div className="h-[6px] overflow-hidden rounded-full bg-[#E9EDF2]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, value > 0 ? 7 : 0)}%`, backgroundColor: color }} />
      </div>
      <span className="whitespace-nowrap text-right text-[10px] font-semibold text-[#334475]">{value} ({pct.toFixed(0)}%)</span>
    </div>
  );
}

export function QuickActions({ actions }: { actions: Array<{ label: string; icon: IconType; href?: string; onClick?: () => void }> }) {
  const className = "flex h-[40px] w-full items-center justify-between border-b border-[#EDF0F4] px-[12px] text-[#1A2F6D] last:border-b-0 hover:bg-[#FAFBFC] transition";
  return (
    <div className="overflow-hidden rounded-[7px] border border-[#e1e5ec] bg-white" style={{ boxShadow: "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px" }}>
      <div className="flex h-[32px] items-center border-b border-slate-200/80 bg-[#f0f3f6] px-3">
        <h2 className="text-[11.5px] font-semibold tracking-[-0.01em] text-[#0f172a]">Quick Actions</h2>
      </div>
      <div className="space-y-1 p-2">
        {actions.map(({ label, icon: Icon, href, onClick }) => {
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-[8px]">
                <Icon size={14} className="shrink-0" />
                <span className="whitespace-nowrap text-[10px] font-semibold">{label}</span>
              </span>
              <ArrowRight size={14} className="shrink-0 text-[#909BB0]" />
            </>
          );
          return href ? (
            <Link key={label} href={href} className={className}>{content}</Link>
          ) : (
            <button key={label} type="button" onClick={onClick} className={className}>{content}</button>
          );
        })}
      </div>
    </div>
  );
}

/** White card with the Organic grey title bar, for forms and detail sections */
export function SectionCard({ title, icon: Icon, children, action }: { title: string; icon?: IconType; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[7px] border border-[#e1e5ec] bg-white" style={{ boxShadow: CARD_SHADOW }}>
      <div className="flex h-[34px] items-center justify-between border-b border-slate-200/80 bg-[#f0f3f6] px-3">
        <h2 className="flex items-center gap-[6px] text-[11.5px] font-semibold tracking-[-0.01em] text-[#0f172a]">
          {Icon && <Icon size={14} className="text-[#293681]" />}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-[12px]">{children}</div>
    </div>
  );
}

export const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#e2e8f0] bg-white px-[10px] text-[10px] font-semibold text-[#334155] outline-none transition-colors hover:border-slate-300 focus:border-[#233D4D]";
export const labelClass = "mb-[4px] block text-[8.5px] font-semibold uppercase tracking-wide text-[#475A83]";
export const primaryButtonClass = primaryButton;
export const outlineButtonClass = outlineButton;
