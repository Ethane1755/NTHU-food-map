import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Category } from "@/modules/shared/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    中式: "🍜",
    早餐: "🍳",
    飲料: "🧋",
    速食: "🍔",
    日式: "🍱",
    便當: "🥡",
    小吃: "🥟",
    其他: "🍽️",
  };
  return map[category] ?? "🍽️";
}

export function getPriceLabel(price_range?: number): string {
  if (!price_range) return "";
  return "$".repeat(price_range);
}

export function getStoreImageSrc(imageUrl?: string): string | undefined {
  const raw = imageUrl?.trim();
  if (!raw) return undefined;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return `/api/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return undefined;
  }
}

export const CATEGORIES: Category[] = [
  "中式",
  "早餐",
  "飲料",
  "速食",
  "日式",
  "便當",
  "小吃",
  "其他",
];

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const WEEK_DAYS_ZH = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
] as const;

type WeekDayZh = (typeof WEEK_DAYS_ZH)[number];

export interface OpeningHourSlot {
  startMinute: number;
  endMinute: number;
  label: string;
}

export type WeeklyOpeningHours = Partial<Record<WeekDayZh, OpeningHourSlot[]>>;

function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function normalizeDayIndex(jsDay: number): number {
  // JS day: 0 Sunday -> convert to Monday-first 0..6 index.
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function getCurrentWeekdayZh(date = new Date()): WeekDayZh {
  return WEEK_DAYS_ZH[normalizeDayIndex(date.getDay())];
}

export function parseStoreOpeningHours(hours?: string): WeeklyOpeningHours {
  if (!hours?.trim()) return {};

  const result: WeeklyOpeningHours = {};
  const dayEntries = hours
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of dayEntries) {
    const matched = entry.match(/^(星期[一二三四五六日])\s+(.+)$/);
    if (!matched) continue;

    const day = matched[1] as WeekDayZh;
    const value = matched[2];
    if (value.includes("休息")) {
      result[day] = [];
      continue;
    }

    const slots = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const range = part.match(/(\d{1,2}):(\d{2})\s*to\s*(\d{1,2}):(\d{2})/i);
        if (!range) return null;

        const startHour = Number(range[1]);
        const startMinute = Number(range[2]);
        const endHour = Number(range[3]);
        const endMinute = Number(range[4]);

        const start = toMinutes(startHour, startMinute);
        let end = toMinutes(endHour, endMinute);
        if (end <= start) {
          // Handle overnight range, e.g. 22:00 to 02:00.
          end += 24 * 60;
        }

        return {
          startMinute: start,
          endMinute: end,
          label: `${range[1]}:${range[2]}-${range[3]}:${range[4]}`,
        } satisfies OpeningHourSlot;
      })
      .filter((slot): slot is OpeningHourSlot => slot !== null);

    result[day] = slots;
  }

  return result;
}

export function isStoreOpenNow(hours?: string, now = new Date()): boolean | undefined {
  const parsed = parseStoreOpeningHours(hours);
  if (Object.keys(parsed).length === 0) return undefined;

  const today = getCurrentWeekdayZh(now);
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const todaySlots = parsed[today] ?? [];

  if (todaySlots.some((slot) => nowMinute >= slot.startMinute && nowMinute < slot.endMinute)) {
    return true;
  }

  // Check overnight slots from previous day.
  const todayIndex = WEEK_DAYS_ZH.indexOf(today);
  const prevDay = WEEK_DAYS_ZH[(todayIndex + 6) % 7];
  const prevSlots = parsed[prevDay] ?? [];
  if (prevSlots.some((slot) => slot.endMinute > 24 * 60 && nowMinute < slot.endMinute - 24 * 60)) {
    return true;
  }

  return false;
}

export interface WeeklyOpeningChartItem {
  day: WeekDayZh;
  totalMinutes: number;
  totalHoursText: string;
  isToday: boolean;
}

export function getWeeklyOpeningChartData(hours?: string, now = new Date()): WeeklyOpeningChartItem[] {
  const parsed = parseStoreOpeningHours(hours);
  const today = getCurrentWeekdayZh(now);

  return WEEK_DAYS_ZH.map((day) => {
    const totalMinutes = (parsed[day] ?? []).reduce((sum, slot) => {
      return sum + Math.max(0, Math.min(slot.endMinute, 24 * 60) - slot.startMinute);
    }, 0);

    return {
      day,
      totalMinutes,
      totalHoursText: totalMinutes === 0 ? "休息" : `${(totalMinutes / 60).toFixed(1)}h`,
      isToday: day === today,
    };
  });
}
