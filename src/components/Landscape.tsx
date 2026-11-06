import { PLACES, PLACE_INFO, WORLD } from "../lib/places";

// 소나무 한 그루: 층층이 쌓인 삼각형을 살짝 비뚤게
function pine(x: number, base: number, h: number, w: number, seed: number) {
  const tiers = 4;
  let d = `M${x - 2},${base} L${x + 2},${base} L${x + 2},${base - h * 0.15} `;
  for (let t = 0; t < tiers; t++) {
    const yb = base - h * 0.15 - (h * 0.85 * t) / tiers;
    const yt = yb - (h * 0.85) / tiers - h * 0.12;
    const ww = (w * (tiers - t)) / tiers;
    const j = ((seed * (t + 3)) % 5) - 2; // 손으로 그린 듯한 흔들림
    d += `M${x - ww / 2 + j},${yb} L${x + j / 2},${yt} L${x + ww / 2 - j},${yb + 1} Z `;
  }
  return d;
}

const BACK_TREES: [number, number, number][] = [
  [585, 150, 60], [640, 200, 70], [735, 240, 80], [800, 170, 64], [870, 230, 78], [945, 190, 70], [1010, 250, 84], [1070, 180, 66], [1115, 130, 52],
];
const FRONT_TREES: [number, number, number][] = [
  [620, 110, 46], [705, 140, 54], [785, 100, 42], [860, 128, 50], [985, 118, 48], [1060, 96, 40],
];

const RIPPLES = Array.from({ length: 20 }, (_, i) => ({
  y: WORLD.sea + 10 + i * 13,
  dash: `${30 + ((i * 37) % 90)} ${50 + ((i * 53) % 140)}`,
  off: (i * 71) % 200,
  o: 0.16 - i * 0.007,
}));

export function Landscape() {
  return (
    <svg className="land" viewBox={`0 0 ${WORLD.w} ${WORLD.h}`} width={WORLD.w} height={WORLD.h} aria-hidden="true">
      <defs>
        <linearGradient id="g-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sea)" }} />
          <stop offset="1" style={{ stopColor: "var(--sea-deep)" }} />
        </linearGradient>
        <linearGradient id="g-beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: "var(--moon)", stopOpacity: 0.22 }} />
          <stop offset="1" style={{ stopColor: "var(--moon)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* 바다 */}
      <rect x={-2000} y={WORLD.sea} width={WORLD.w + 4000} height={WORLD.h - WORLD.sea} fill="url(#g-sea)" />
      <rect x={-2000} y={WORLD.h - 1} width={WORLD.w + 4000} height={3000} style={{ fill: "var(--sea-deep)" }} />
      <g className="ripples">
        {RIPPLES.map((r, i) => (
          <line key={i} x1={0} x2={WORLD.w} y1={r.y} y2={r.y} strokeDasharray={r.dash} strokeDashoffset={r.off} style={{ opacity: Math.max(0.02, r.o) }} />
        ))}
      </g>

      {/* 언덕 */}
      <path className="ground" d="M0,640 L0,452 C70,410 150,356 258,350 C352,346 438,396 512,492 C556,552 598,612 646,640 Z" />
      <path className="grass" d="M180,372 l3,-9 l2,9 M300,356 l2,-8 l3,8 M420,404 l3,-9 l2,9 M95,420 l2,-8 l3,8" />

      {/* 숲 */}
      <g className="trees-back">{BACK_TREES.map(([x, h, w], i) => <path key={i} d={pine(x, 616, h, w, i + 1)} />)}</g>
      <path className="ground" d="M548,640 C600,612 690,600 800,604 C910,608 1000,598 1084,612 C1112,618 1132,630 1146,640 Z" />
      <g className="trees">{FRONT_TREES.map(([x, h, w], i) => <path key={i} d={pine(x, 624, h, w, i + 7)} />)}</g>

      {/* 항구 */}
      <g className="pilings">
        {Array.from({ length: 9 }, (_, i) => <rect key={i} x={1108 + i * 57} y={696} width={5} height={58} />)}
      </g>
      <rect className="deck" x={1096} y={688} width={480} height={9} rx={1} />
      <g className="boat">
        <path d="M1590,752 L1668,752 L1654,766 L1602,766 Z" />
        <path d="M1628,752 L1628,700 L1652,744 Z" />
      </g>

      {/* 등대 */}
      <path className="ground" d="M1536,640 C1566,602 1588,546 1620,502 C1662,450 1722,414 1800,402 C1870,396 1940,392 2000,390 L2000,640 Z" />
      <g className="beam"><path d="M1850,250 L1250,170 L1250,330 Z" fill="url(#g-beam)" /></g>
      <path className="tower" d="M1833,404 L1867,404 L1860,262 L1840,262 Z" />
      <path className="tower-band" d="M1837,350 L1863,350 L1862,330 L1838,330 Z M1839,296 L1861,296 L1860,280 L1840,280 Z" />
      <rect className="tower" x={1836} y={238} width={28} height={24} />
      <path className="tower" d="M1832,240 L1868,240 L1850,218 Z" />
      <circle className="beacon" cx={1850} cy={250} r={6} />

      {/* 장소 이름 */}
      {PLACES.map((p) => (
        <text key={p} className="place-name" x={PLACE_INFO[p].name[0]} y={PLACE_INFO[p].name[1]} textAnchor="middle">{p}</text>
      ))}
    </svg>
  );
}

/** 먼 산과 안개. 지도보다 천천히 움직여서 깊이감을 줘요. 가장자리가 비지 않게 양옆으로 넓게 그려요. */
export function FarLayer() {
  return (
    <svg className="land" viewBox={`-600 0 ${WORLD.w + 1200} ${WORLD.h}`} width={WORLD.w + 1200} height={WORLD.h} style={{ left: -600 }} aria-hidden="true">
      <defs>
        <linearGradient id="g-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--haze)", stopOpacity: 0 }} />
          <stop offset=".55" style={{ stopColor: "var(--haze)", stopOpacity: 0.28 }} />
          <stop offset="1" style={{ stopColor: "var(--haze)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path className="far" d="M-600,590 C-420,556 -260,570 -120,584 C0,596 120,560 230,566 C340,572 450,594 520,548 C590,540 760,556 830,590 C900,600 1070,578 1150,540 C1230,530 1410,556 1480,592 C1550,600 1720,580 1820,548 C1920,536 2100,560 2250,574 C2400,586 2500,560 2600,566 L2600,650 L-600,650 Z" />
      <rect x={-600} y={575} width={WORLD.w + 1200} height={90} fill="url(#g-haze)" />
    </svg>
  );
}
