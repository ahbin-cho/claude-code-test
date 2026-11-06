// 등불을 걸 수 있는 장소와 지도 위 자리. 좌표는 지도(WORLD) 기준 px.

export const PLACES = ["항구", "숲", "언덕", "등대"] as const;
export type Place = (typeof PLACES)[number];

export const WORLD = { w: 2000, h: 900, sea: 640 };

type Pt = [number, number];

export const PLACE_INFO: Record<Place, {
  cx: number;      // 이 장소로 이동할 때 화면 가운데에 올 x
  name: Pt;        // 지도에 적힌 장소 이름 위치
  post: number;    // 등불 아래 기둥 길이
  cord: number;    // 등불 위 끈 길이 (숲은 가지에 매달려요)
  blurb: string;
  slots: Pt[];     // 등불 바닥이 놓이는 자리 (가운데부터 바깥쪽 순서)
}> = {
  항구: {
    cx: 1340, name: [1335, 760], post: 40, cord: 6,
    blurb: "배가 들어오는 부두에 걸어요.",
    slots: [[1335, 690], [1270, 690], [1400, 690], [1205, 690], [1465, 690], [1140, 690], [1530, 690]],
  },
  숲: {
    cx: 840, name: [850, 634], post: 0, cord: 30,
    blurb: "나무 사이, 조용한 곳에 매달아요.",
    slots: [[820, 500], [890, 562], [745, 578], [960, 515], [675, 520], [1030, 572], [600, 560], [1095, 540], [710, 455], [920, 450]],
  },
  언덕: {
    cx: 300, name: [270, 600], post: 14, cord: 6,
    blurb: "멀리까지 내다보이는 언덕에 꽂아요.",
    slots: [[240, 360], [330, 364], [150, 383], [410, 393], [70, 418], [480, 448], [530, 522], [120, 480], [270, 440], [400, 480], [200, 548], [330, 530]],
  },
  등대: {
    cx: 1760, name: [1760, 600], post: 14, cord: 6,
    blurb: "길을 비춰주는 등대 곁에 세워요.",
    slots: [[1745, 422], [1685, 447], [1800, 408], [1625, 505], [1915, 402], [1582, 565], [1975, 398], [1700, 520], [1800, 480], [1930, 470], [1650, 590]],
  },
};

export function placeOf(p: string | null | undefined): Place {
  return (PLACES as readonly string[]).includes(p ?? "") ? (p as Place) : "항구";
}

/** 장소 안에서 i번째 등불의 자리. 자리가 모자라면 조금씩 비켜서 놓아요. */
export function slotOf(place: Place, i: number): Pt {
  const base = PLACE_INFO[place].slots;
  const [x, y] = base[i % base.length];
  const k = Math.floor(i / base.length);
  if (!k) return [x, y];
  return [x + 32 * k, place === "항구" ? y : y + 26 * k];
}
