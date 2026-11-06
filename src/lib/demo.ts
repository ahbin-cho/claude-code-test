// Supabase 설정이 없을 때 보여주는 체험용 등불. 저장되지 않아요.
import type { Lantern, Warmth } from "./supabase";
import { today, ymd } from "./waiting";

export const DEMO_ME = "demo-me";

const shift = (days: number) => {
  const d = today();
  d.setDate(d.getDate() + days);
  return ymd(d);
};

const sample: [string, string, number, number, string, string][] = [
  ["지수", "군대", -400, 145, "오늘도 편지 한 장 썼어요.", "언덕"],
  ["민호", "장거리 연애", -60, 9, "공항 가는 길을 벌써 외웠어요.", "항구"],
  ["엄마", "해외에 있는 가족", -200, 30, "김치 담가 놓을게요.", "등대"],
  ["하준", "군대", -500, 1, "내일이에요. 잠이 안 와요.", "항구"],
  ["서연", "장거리 연애", -30, 80, "같은 달을 보고 있대요.", "숲"],
  ["아빠", "해외에 있는 가족", -300, -2, "드디어 다시 만났어요.", "등대"],
  ["유나", "장거리 연애", -90, 40, "전화 끊고 한참 서 있었어요.", "숲"],
  ["태윤", "군대", -320, 220, "휴가 날짜만 세고 있어요.", "언덕"],
  ["할머니", "해외에 있는 가족", -150, 60, "", "항구"],
];

export const demoLanterns = (): Lantern[] =>
  sample.map(([who, kind, start, end, line, place], i) => ({
    user_id: `demo-${i}`,
    who,
    kind,
    start_date: shift(start),
    end_date: shift(end),
    line,
    place,
    created_at: new Date(Date.now() - (sample.length - i) * 60_000).toISOString(),
  }));

export const demoWarmth = (): Warmth[] =>
  ["demo-0", "demo-0", "demo-1", "demo-3", "demo-3", "demo-3"].map((to_id, i) => ({
    from_id: `demo-${(i + 1) % sample.length}`,
    to_id,
    day: ymd(today()),
  }));

export const demoOnline = () => new Set(["demo-1", "demo-3", "demo-6", DEMO_ME]);
