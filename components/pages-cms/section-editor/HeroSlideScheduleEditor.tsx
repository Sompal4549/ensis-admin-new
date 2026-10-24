"use client";

import { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { FieldLabel } from "../fields";

/**
 * Optional display window of one hero slide, in India time. The website (ensis-Frontend HeroCarousel) shows a
 * scheduled slide only inside its window and, while it is live, hides the normal (unscheduled) slides.
 * When the time is over the normal slides come back by themselves.
 */
export type SlideSchedule = {
  /** "day": one whole day. "range": several days, or a day with specific times. */
  mode: "day" | "range";
  /** datetime-local strings in India time, e.g. "2026-10-25T09:00". The end is exclusive. */
  start: string;
  end: string;
};

const IST_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Same rule as the website (ensis-Frontend/src/lib/heroSchedule.ts): plain values are IST
const parseIst = (value?: string): number | null => {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(v);
  const ms = Date.parse(hasZone ? v : `${/T\d{2}:\d{2}$/.test(v) ? `${v}:00` : v}+05:30`);
  return Number.isNaN(ms) ? null : ms;
};

/** Epoch ms → "YYYY-MM-DDTHH:mm" in India time */
const toIst = (ms: number) => new Date(ms + IST_MS).toISOString().slice(0, 16);
const istDay = (offsetDays = 0) => toIst(Date.now() + offsetDays * DAY_MS).slice(0, 10);
const addDays = (day: string, n: number) => toIst(Date.parse(`${day}T00:00:00+05:30`) + n * DAY_MS).slice(0, 10);

const formatIst = (value: string) => {
  const ms = parseIst(value);
  if (ms === null) return "";
  const [date, time] = toIst(ms).split("T");
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y} ${time}`;
};

/** What the calendar shows, read back from the stored window: first day, last day (inclusive) and the times */
type Picked = { first: string; last: string; fromTime: string; untilTime: string; whole: boolean };

const pickedOf = (s: SlideSchedule): Picked => {
  const first = s.start.slice(0, 10);
  const fromTime = s.start.slice(11, 16) || "00:00";
  const endDay = s.end.slice(0, 10) || first;
  const endTime = s.end.slice(11, 16) || "00:00";
  const whole = fromTime === "00:00" && endTime === "00:00" && endDay > first;
  return {
    first,
    // a whole-day window ends at midnight of the day AFTER its last day
    last: whole ? addDays(endDay, -1) : endDay,
    fromTime,
    untilTime: endTime,
    whole,
  };
};

/** Whole days first..last, or specific times on those days */
const buildSchedule = (first: string, last: string, whole: boolean, fromTime = "09:00", untilTime = "18:00"): SlideSchedule =>
  whole
    ? { mode: first === last ? "day" : "range", start: `${first}T00:00`, end: `${addDays(last, 1)}T00:00` }
    : { mode: "range", start: `${first}T${fromTime}`, end: `${last}T${untilTime}` };

/** What the "Schedule" toggle switches on: today, whole day (India time) */
export const todaySlideSchedule = (): SlideSchedule => buildSchedule(istDay(0), istDay(0), true);

type Status = { label: string; tone: string; chip: string; note: string };

const statusOf = (s: SlideSchedule, now = Date.now()): Status => {
  const start = parseIst(s.start);
  const end = parseIst(s.end);
  if (start === null && end === null) return { label: "No dates", tone: "border-rose-200 bg-rose-50 text-rose-600", chip: "bg-rose-50 text-rose-600", note: "Pick a date, otherwise this slide stays a normal slide." };
  if (start !== null && end !== null && end <= start) return { label: "End is before start", tone: "border-rose-200 bg-rose-50 text-rose-600", chip: "bg-rose-50 text-rose-600", note: "The end must be after the start." };
  if (start !== null && now < start) return { label: "Upcoming", tone: "border-amber-200 bg-amber-50 text-amber-700", chip: "bg-amber-50 text-amber-700", note: `Goes live ${formatIst(s.start)} (India time). Until then the normal slides show.` };
  if (end !== null && now >= end) return { label: "Ended", tone: "border-slate-200 bg-slate-100 text-slate-500", chip: "bg-slate-100 text-slate-500", note: "Time is over: the normal slides are showing again." };
  return {
    label: "Live now",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    chip: "bg-emerald-50 text-emerald-700",
    note: `Showing now${end !== null ? ` · the normal slides return ${formatIst(s.end)} (India time)` : ""}. Normal slides are hidden meanwhile.`,
  };
};

const timeInputClass =
  "h-[32px] w-full bg-white px-[8px] text-[11px] font-medium text-[#414b5e] shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_0_0_1px_rgba(27,31,35,0.15)] focus:outline-none focus:shadow-[0_0_0_2px_rgba(37,99,235,0.45)]";

const presetBtn = (active: boolean) =>
  `h-[28px] rounded-[5px] border px-[10px] text-[10px] font-bold transition ${
    active ? "border-[#1e40af] bg-[#1e40af] text-white" : "border-[#bfdbfe] bg-white text-[#1e40af] hover:bg-blue-50"
  }`;

/** Month grid: click a date for one day, then a later date to make a range */
function MonthCalendar({
  picked,
  today,
  onPick,
}: {
  picked?: Picked;
  today: string;
  onPick: (day: string) => void;
}) {
  const anchor = picked?.first || today;
  const [view, setView] = useState(() => ({ y: Number(anchor.slice(0, 4)), m: Number(anchor.slice(5, 7)) - 1 }));

  const firstWeekday = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];

  const move = (delta: number) =>
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      return { y: Math.floor(total / 12), m: total % 12 };
    });

  return (
    <div className="w-full max-w-[262px] rounded-[6px] border border-[#e2e8f0] bg-white p-[8px]">
      <div className="mb-[6px] flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => move(-1)} className="grid h-[26px] w-[26px] place-items-center rounded-[5px] text-[#475569] hover:bg-slate-100">
          <ChevronLeft className="h-[14px] w-[14px]" />
        </button>
        <span className="text-[11.5px] font-bold text-[#1e293b]">
          {MONTHS[view.m]} {view.y}
        </span>
        <button type="button" aria-label="Next month" onClick={() => move(1)} className="grid h-[26px] w-[26px] place-items-center rounded-[5px] text-[#475569] hover:bg-slate-100">
          <ChevronRight className="h-[14px] w-[14px]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-[2px] text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-[3px] text-[9px] font-bold uppercase text-[#94a3b8]">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const inRange = !!picked && day >= picked.first && day <= picked.last;
          const isEdge = !!picked && (day === picked.first || day === picked.last);
          const isToday = day === today;
          const past = day < today;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onPick(day)}
              className={`h-[28px] text-[11px] font-semibold transition ${
                isEdge
                  ? "bg-[#1e40af] text-white"
                  : inRange
                    ? "bg-[#dbeafe] text-[#1e40af]"
                    : past
                      ? "text-[#b6bfcc] hover:bg-slate-100"
                      : "text-[#334155] hover:bg-slate-100"
              } ${picked && day === picked.first ? "rounded-l-[6px]" : ""} ${picked && day === picked.last ? "rounded-r-[6px]" : ""} ${!inRange ? "rounded-[6px]" : ""} ${
                isToday && !isEdge ? "ring-1 ring-inset ring-[#1e40af]" : ""
              }`}
            >
              {Number(day.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HeroSlideScheduleEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: SlideSchedule | undefined) => void;
}) {
  const raw = value && typeof value === "object" ? (value as Partial<SlideSchedule>) : undefined;
  const schedule: SlideSchedule | undefined =
    raw && (typeof raw.start === "string" || typeof raw.end === "string")
      ? { mode: raw.mode === "day" ? "day" : "range", start: raw.start ?? "", end: raw.end ?? "" }
      : undefined;

  const today = istDay(0);
  const tomorrow = istDay(1);
  const status = schedule ? statusOf(schedule) : undefined;
  const picked = schedule && schedule.start ? pickedOf(schedule) : undefined;
  const singleDay = !!picked && picked.first === picked.last;

  // One click = that single day; a later click while a single day is selected = a range up to it
  const pickDay = (day: string) => {
    if (!picked || !singleDay || day <= picked.first) {
      onChange(buildSchedule(day, day, true));
    } else {
      onChange(buildSchedule(picked.first, day, picked.whole || !schedule, picked.fromTime, picked.untilTime));
    }
  };

  const setWhole = (whole: boolean) => {
    if (!picked) return;
    onChange(buildSchedule(picked.first, picked.last, whole, picked.whole ? "09:00" : picked.fromTime, picked.whole ? "18:00" : picked.untilTime));
  };

  return (
    <div className="col-span-2 flex flex-col gap-[10px] rounded-[6px] border border-[#dbeafe] bg-[#f8fbff] p-[10px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-[6px] text-[11.5px] font-bold text-[#1e40af]">
          <CalendarClock className="h-[14px] w-[14px]" />
          Schedule
          <span className={`rounded-full px-[9px] py-[2px] text-[9.5px] font-bold ${status ? status.chip : "bg-white text-slate-500"}`}>
            {status ? status.label : "Always shown"}
          </span>
        </div>
        <div className="flex flex-wrap gap-[6px]">
          <button type="button" onClick={() => onChange(buildSchedule(today, today, true))} className={presetBtn(!!picked && singleDay && picked.whole && picked.first === today)}>
            Today only
          </button>
          <button type="button" onClick={() => onChange(buildSchedule(tomorrow, tomorrow, true))} className={presetBtn(!!picked && singleDay && picked.whole && picked.first === tomorrow)}>
            Tomorrow
          </button>
          <button type="button" onClick={() => onChange(buildSchedule(today, addDays(today, 6), true))} className={presetBtn(!!picked && picked.whole && picked.first === today && picked.last === addDays(today, 6))}>
            Next 7 days
          </button>
          {schedule && (
            <button type="button" onClick={() => onChange(undefined)} className="h-[28px] rounded-[5px] border border-rose-200 bg-white px-[10px] text-[10px] font-bold text-rose-500 hover:bg-rose-50">
              Remove schedule
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[12px] md:grid-cols-[262px_1fr]">
        {/* key: the calendar jumps to the month of the selection when a preset moves it */}
        <MonthCalendar key={picked ? picked.first.slice(0, 7) : "none"} picked={picked} today={today} onPick={pickDay} />

        <div className="flex flex-col gap-[8px]">
          {!schedule && (
            <p className="text-[10px] font-medium text-[#64748b]">
              No schedule: this is a normal hero slide and is always part of the hero. Click a date to show it only on that day, then click a later date to make a range, or use a button above.
              While a scheduled slide is live, only scheduled slides show; when its time is over the normal slides come back automatically (India time).
            </p>
          )}

          {schedule && picked && (
            <>
              <p className="text-[11px] font-semibold text-[#1e293b]">
                {singleDay ? `Shows on ${picked.first.split("-").reverse().join("-")}` : `Shows ${picked.first.split("-").reverse().join("-")} to ${picked.last.split("-").reverse().join("-")}`}
                {picked.whole ? " · whole day" + (singleDay ? "" : "s") : ""}
              </p>
              <p className="text-[10px] font-medium text-[#64748b]">
                {singleDay ? "Click a later date to make it a range." : "Click any date to start over with a single day."}
              </p>

              <label className="flex cursor-pointer items-center gap-[7px] text-[10.5px] font-bold text-[#334155]">
                <input type="checkbox" checked={picked.whole} onChange={(e) => setWhole(e.target.checked)} className="h-[14px] w-[14px] accent-[#1e40af]" />
                Whole day{singleDay ? "" : "s"} (12:00 AM to midnight)
              </label>

              {!picked.whole && (
                <div className="grid grid-cols-2 gap-[10px]">
                  <div>
                    <FieldLabel>From (time on first day)</FieldLabel>
                    <input type="time" value={picked.fromTime} onChange={(e) => onChange(buildSchedule(picked.first, picked.last, false, e.target.value, picked.untilTime))} className={timeInputClass} />
                  </div>
                  <div>
                    <FieldLabel>Until (time on last day)</FieldLabel>
                    <input type="time" value={picked.untilTime} onChange={(e) => onChange(buildSchedule(picked.first, picked.last, false, picked.fromTime, e.target.value))} className={timeInputClass} />
                  </div>
                </div>
              )}

              {status && <div className={`mt-auto rounded-[6px] border px-3 py-[9px] text-center text-[11px] font-bold ${status.tone}`}>{status.note}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
