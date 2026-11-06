import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lantern } from "../lib/supabase";
import { PLACE_INFO, WORLD, placeOf, slotOf, type Place } from "../lib/places";
import { daysLeft, ddayText, progressOf, titleOf } from "../lib/waiting";
import { Landscape } from "./Landscape";

const MAX = 2.2;
type View = { x: number; y: number; s: number };
type Size = { w: number; h: number };

const fitScale = (sz: Size) => Math.max(sz.h / WORLD.h, sz.w / WORLD.w);

/** 끌어서 둘러보고, 두 손가락으로 확대할 수 있는 밤 마을 지도 */
export function World({ lanterns, me, online, pulseId, focus, onPick }: {
  lanterns: Lantern[];
  me: string | null;
  online: Set<string>;
  pulseId: string | null;
  focus: { place: Place; n: number } | null;
  onPick: (id: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ x: 0, y: 0, s: 1 });
  const [glide, setGlide] = useState(false);
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const viewRef = useRef(view);
  viewRef.current = view;

  const clamp = useCallback((v: View, sz: Size = sizeRef.current): View => {
    const s = Math.min(MAX, Math.max(fitScale(sz), v.s));
    return {
      s,
      x: Math.min(0, Math.max(sz.w - WORLD.w * s, v.x)),
      y: Math.min(0, Math.max(sz.h - WORLD.h * s, v.y)),
    };
  }, []);

  const lookAt = useCallback(
    (wx: number, sz: Size, s: number) => clamp({ s, x: sz.w / 2 - wx * s, y: sz.h * 0.62 - 560 * s }, sz),
    [clamp],
  );

  // 화면 크기 재기. 처음 한 번은 항구를 보여줘요.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      const sz = { w: el.clientWidth, h: el.clientHeight };
      setSize(sz);
      if (first) setView(lookAt(PLACE_INFO.항구.cx, sz, fitScale(sz)));
      else setView((v) => clamp(v, sz));
      first = false;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [clamp, lookAt]);

  // 장소 버튼을 누르면 그쪽으로 천천히 이동해요
  useEffect(() => {
    if (!focus || !size.w) return;
    setGlide(true);
    setView((v) => lookAt(PLACE_INFO[focus.place].cx, sizeRef.current, v.s));
    const t = setTimeout(() => setGlide(false), 700);
    return () => clearTimeout(t);
  }, [focus, size.w, lookAt]);

  // 끌기와 두 손가락 확대
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ x: number; y: number; d: number } | null>(null);
  const moved = useRef(0);

  const snap = () => {
    const p = [...ptrs.current.values()];
    if (!p.length) return null;
    return {
      x: p.reduce((a, b) => a + b.x, 0) / p.length,
      y: p.reduce((a, b) => a + b.y, 0) / p.length,
      d: p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0,
    };
  };

  const zoomAt = useCallback((v: View, px: number, py: number, k: number): View => {
    const s = Math.min(MAX, Math.max(fitScale(sizeRef.current), v.s * k));
    const r = s / v.s;
    return { s, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!ptrs.current.has(e.pointerId)) return;
      ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const now = snap(), prev = last.current;
      if (!now || !prev || !box.current) return;
      const r = box.current.getBoundingClientRect();
      const dx = now.x - prev.x, dy = now.y - prev.y;
      moved.current += Math.abs(dx) + Math.abs(dy);
      let v = viewRef.current;
      if (prev.d && now.d) v = zoomAt(v, now.x - r.left, now.y - r.top, now.d / prev.d);
      setView(clamp({ ...v, x: v.x + dx, y: v.y + dy }));
      last.current = now;
    };
    const up = (e: PointerEvent) => {
      ptrs.current.delete(e.pointerId);
      last.current = snap();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [clamp, zoomAt]);

  // 같은 장소끼리 모아 먼저 건 순서대로 자리를 정해요
  const placed = useMemo(() => {
    const count = new Map<Place, number>();
    return [...lanterns]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((l) => {
        const place = placeOf(l.place);
        const i = count.get(place) ?? 0;
        count.set(place, i + 1);
        const [x, y] = slotOf(place, i);
        return { l, place, x, y };
      });
  }, [lanterns]);

  return (
    <div
      className="world"
      ref={box}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        setGlide(false);
        if (!ptrs.current.size) moved.current = 0;
        ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        last.current = snap();
      }}
      onWheel={(e) => {
        setGlide(false);
        const r = e.currentTarget.getBoundingClientRect();
        const v = viewRef.current;
        if (e.ctrlKey) setView(clamp(zoomAt(v, e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01))));
        else setView(clamp({ ...v, x: v.x - (e.deltaX || e.deltaY), y: v.y - (e.deltaX ? e.deltaY : 0) }));
      }}
      onClickCapture={(e) => {
        // 끌다가 손을 뗀 건 등불을 누른 게 아니에요
        if (moved.current > 8) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <div
        className={`map${glide ? " glide" : ""}`}
        style={{ width: WORLD.w, height: WORLD.h, transform: `translate3d(${view.x}px,${view.y}px,0) scale(${view.s})` }}
      >
        <Landscape />
        {placed.map(({ l, place, x, y }, i) => {
          const info = PLACE_INFO[place];
          const n = daysLeft(l);
          const home = n != null && n <= 0;
          const glow = home ? 1 : 0.3 + 0.7 * progressOf(l);
          const cls = ["lantern", l.user_id === me && "mine", online.has(l.user_id) && "here", home && "home", pulseId === l.user_id && "pulse"]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={l.user_id}>
              {place === "항구" && <span className="reflect" style={{ left: x, top: y + 20, opacity: 0.1 + 0.4 * glow, animationDelay: `${-i * 0.7}s` }} />}
              <button
                className={cls}
                style={{ left: x, top: y, ["--i" as string]: i }}
                onClick={() => onPick(l.user_id)}
                onFocus={() => {
                  const v = viewRef.current, sx = x * v.s + v.x;
                  if (sx < 40 || sx > sizeRef.current.w - 40) setView(lookAt(x, sizeRef.current, v.s));
                }}
                aria-label={`${titleOf(l)}, ${place}, ${ddayText(n)}`}
              >
                <span className="label">
                  {l.who}
                  <span className="dd">{ddayText(n)}</span>
                </span>
                <span className="swing" style={{ animationDelay: `${-i * 0.9}s` }}>
                  <span className="cord" style={{ height: info.cord }} />
                  <span
                    className="lamp"
                    style={{
                      opacity: 0.4 + 0.6 * glow,
                      boxShadow: `0 0 ${10 + 30 * glow}px ${2 + 10 * glow}px rgba(255,184,103,${0.15 + 0.45 * glow})`,
                    }}
                  />
                </span>
                {info.post > 0 && <span className="post" style={{ height: info.post }} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
