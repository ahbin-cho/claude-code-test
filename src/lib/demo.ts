// Supabase 설정이 없을 때 보여주는 체험용 등불. 저장되지 않아요.
import type { Lantern, Warmth } from "./supabase";
import { today, ymd } from "./waiting";

export const DEMO_ME = "demo-me";

const shift = (days: number) => {
  const d = today();
  d.setDate(d.getDate() + days);
  return ymd(d);
};

const sample: [string, string, number, number, string][] = [
  ["지수", "군대", -400, 145, "오늘도 편지 한 장 썼어요."],
  ["민호", "장거리 연애", -60, 9, "공항 가는 길을 벌써 외웠어요."],
  ["엄마", "해외에 있는 가족", -200, 30, "김치 담가 놓을게요."],
  ["하준", "군대", -500, 1, "내일이에요. 잠이 안 와요."],
  ["서연", "장거리 연애", -30, 80, "같은 달을 보고 있대요."],
  ["아빠", "해외에 있는 가족", -300, -2, "드디어 다시 만났어요."],
];

export const demoLanterns = (): Lantern[] =>
  sample.map(([who, kind, start, end, line], i) => ({
    user_id: `demo-${i}`,
    who,
    kind,
    start_date: shift(start),
    end_date: shift(end),
    line,
    created_at: new Date(Date.now() - (sample.length - i) * 60_000).toISOString(),
  }));

export const demoWarmth = (): Warmth[] =>
  ["demo-0", "demo-0", "demo-1", "demo-3", "demo-3", "demo-3"].map((to_id, i) => ({
    from_id: `demo-${(i + 1) % sample.length}`,
    to_id,
    day: ymd(today()),
  }));

export const demoOnline = () => new Set(["demo-1", "demo-3", DEMO_ME]);
