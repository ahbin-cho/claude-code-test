// 등불을 걸 수 있는 장소. 좌표는 3D 마을 기준 (x: 왼쪽-오른쪽, z: 안쪽-바다쪽, y: 높이).

export const PLACES = ["항구", "숲", "언덕", "등대"] as const;
export type Place = (typeof PLACES)[number];

/** 바다 위로 솟은 섬(둥근 지형). 구의 윗부분이 땅이 돼요. */
export const ISLANDS = {
  언덕: { x: -38, z: -12, cy: -22, r: 32 },
  숲: { x: -8, z: -4, cy: -60, r: 62 },
  등대: { x: 36, z: -10, cy: -14, r: 22 },
} as const;

export const PIER = { x: 11, z0: -2, len: 32, w: 4, deck: 0.9 };

export const PLACE_INFO: Record<Place, { x: number; z: number; blurb: string; hang: boolean }> = {
  항구: { x: PIER.x, z: 10, blurb: "배가 들어오는 부두에 걸어요.", hang: false },
  숲: { x: ISLANDS.숲.x, z: ISLANDS.숲.z, blurb: "나무 사이, 조용한 곳에 매달아요.", hang: true },
  언덕: { x: ISLANDS.언덕.x, z: ISLANDS.언덕.z, blurb: "멀리까지 내다보이는 언덕에 꽂아요.", hang: false },
  등대: { x: ISLANDS.등대.x, z: ISLANDS.등대.z, blurb: "길을 비춰주는 등대 곁에 세워요.", hang: false },
};

export function placeOf(p: string | null | undefined): Place {
  return (PLACES as readonly string[]).includes(p ?? "") ? (p as Place) : "항구";
}

/** 땅 높이. 바다면 0 이하. */
export function groundAt(x: number, z: number) {
  let y = -Infinity;
  for (const s of Object.values(ISLANDS)) {
    const d2 = (x - s.x) ** 2 + (z - s.z) ** 2;
    if (d2 < s.r * s.r) y = Math.max(y, s.cy + Math.sqrt(s.r * s.r - d2));
  }
  return y;
}

/**
 * 장소 안에서 i번째 등불의 자리 [x, z].
 * 가운데부터 해바라기 씨처럼 퍼져 나가서, 등불이 많아져도 겹치지 않아요.
 */
export function slotOf(place: Place, i: number): [number, number] {
  if (place === "항구") {
    const side = i % 2 ? 1 : -1;
    return [PIER.x + side * (PIER.w / 2 - 0.4), PIER.z0 + 2 + i * 1.5]; // 양쪽을 엇갈려서 이름표가 겹치지 않게
  }
  const c = PLACE_INFO[place];
  const k = place === "등대" ? i + 4 : i; // 등대 꼭대기는 비워둬요
  const r = (place === "숲" ? 2.3 : 2.6) * Math.sqrt(k + 0.5);
  const a = k * 2.39996;
  return [c.x + r * Math.cos(a), c.z + r * Math.sin(a)];
}
