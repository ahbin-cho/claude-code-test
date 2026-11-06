import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lantern } from "../lib/supabase";
import { PLACE_INFO, WORLD, placeOf, slotOf, type Place } from "../lib/places";
import { daysLeft, ddayText, progressOf, titleOf } from "../lib/waiting";
import { FarLayer, Landscape } from "./Landscape";

type View = { x: number; y: number; s: number };
type Size = { w: number; h: number };
export type Focus = { place: Place | "all"; n: number };

const MAX = 2.4;
const PARALLAX = 0.7; // 먼 산은 지도의 70% 속도로 움직여요

/** 마을 전체가 멀리 보이는 배율 */
const overScale = (sz: Size) => Math.max(sz.w / WORLD.w, (sz.h * 0.55) / WORLD.h);
/** 한 장소를 들여다보는 배율 */
const placeScale = (sz: Size) => Math.max(sz.w / WORLD.w, sz.h / WORLD.h) * 1.05;
/** 등불 하나에 다가가는 배율 */
const lanternScale = (sz: Size) => placeScale(sz) * 1.45;

/**
 * 밤 마을 지도. 처음엔 멀리서 마을 전체를 보고,
 * 장소나 등불을 고르면 그쪽으로 다가가요. 끌기와 두 손가락 확대도 돼요.
 */
export function World({ lanterns, me, online, pulseId, focus, selectedId, onPick }: {
  lanterns: Lantern[];
  me: string | null;
  online: Set<string>;
  pulseId: string | null;
  focus: Focus | null;
  selectedId: string | null;
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
    const s = Math.min(MAX, Math.max(overScale(sz), v.s));
    const h = WORLD.h * s;
    return {
      s,
      x: Math.min(0, Math.max(sz.w - WORLD.w * s, v.x)),
      // 지도가 화면보다 낮으면 수평선을 화면 60% 높이에 두고, 아래는 바다가 이어져요
      y: h < sz.h ? sz.h * 0.6 - WORLD.sea * s : Math.min(0, Math.max(sz.h - h - sz.h * 0.45, v.y)), // 아래로는 바다가 더 이어져요
    };
  }, []);

  /** 지도 위 (wx, wy)가 화면 가로 가운데, 세로 fy 지점에 오도록 */
  const lookAt = useCallback(
    (wx: number, wy: number, s: number, fy = 0.62, sz: Size = sizeRef.current) =>
      clamp({ s, x: sz.w / 2 - wx * s, y: sz.h * fy - wy * s }, sz),
    [clamp],
  );

  const flyTo = useCallback((v: View) => {
    setGlide(true);
    setView(v);
  }, []);
  useEffect(() => {
    if (!glide) return;
    const t = setTimeout(() => setGlide(false), 800);
    return () => clearTimeout(t);
  }, [glide, view]);

  // 화면 크기 재기. 처음엔 마을 전체를 멀리서 보여줘요.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      const sz = { w: el.clientWidth, h: el.clientHeight };
      setSize(sz);
      if (first) setView(lookAt(PLACE_INFO.항구.cx - 200, 560, overScale(sz), 0.62, sz));
      else setView((v) => clamp(v, sz));
      first = false;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [clamp, lookAt]);

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

  // 위쪽 장소 이름을 누르면 그곳으로 다가가요 ("전체"는 멀리서 보기)
  useEffect(() => {
    if (!focus || !size.w) return;
    if (focus.place === "all") flyTo(lookAt(1000, 560, overScale(sizeRef.current)));
    else flyTo(lookAt(PLACE_INFO[focus.place].cx, 560, placeScale(sizeRef.current)));
  }, [focus, size.w, flyTo, lookAt]);

  // 등불을 열면 그 등불에 바짝 다가가고, 닫으면 장소 보기로 물러나요
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    const was = prevSelected.current;
    prevSelected.current = selectedId;
    if (!size.w) return;
    const sz = sizeRef.current;
    if (selectedId) {
      const p = placed.find((q) => q.l.user_id === selectedId);
      if (p) flyTo(lookAt(p.x, p.y - 30, Math.max(viewRef.current.s, lanternScale(sz)), 0.36));
    } else if (was) {
      const v = viewRef.current;
      const cx = (sz.w / 2 - v.x) / v.s;
      flyTo(lookAt(cx, 560, placeScale(sz)));
    }
  }, [selectedId, placed, size.w, flyTo, lookAt]);

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
    const s = Math.min(MAX, Math.max(overScale(sizeRef.current), v.s * k));
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

  const far = size.w > 0 && view.s < placeScale(size) * 0.8;

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
        className={`map map-far${glide ? " glide" : ""}`}
        style={{ width: WORLD.w, height: WORLD.h, transform: `translate3d(${view.x * PARALLAX}px,${view.y}px,0) scale(${view.s})` }}
      >
        <FarLayer />
      </div>
      <div
        className={`map${glide ? " glide" : ""}${far ? " is-far" : ""}${selectedId ? " has-focus" : ""}`}
        style={{ width: WORLD.w, height: WORLD.h, transform: `translate3d(${view.x}px,${view.y}px,0) scale(${view.s})` }}
      >
        <Landscape />
        {placed.map(({ l, place, x, y }, i) => {
          const info = PLACE_INFO[place];
          const n = daysLeft(l);
          const home = n != null && n <= 0;
          const glow = home ? 1 : 0.3 + 0.7 * progressOf(l);
          const cls = [
            "lantern",
            l.user_id === me && "mine",
            online.has(l.user_id) && "here",
            home && "home",
            pulseId === l.user_id && "pulse",
            selectedId === l.user_id && "focused",
          ].filter(Boolean).join(" ");
          return (
            <div key={l.user_id}>
              {place === "항구" && <span className="reflect" style={{ left: x, top: y + 20, opacity: 0.1 + 0.4 * glow, animationDelay: `${-i * 0.7}s` }} />}
              <button
                className={cls}
                style={{ left: x, top: y, ["--i" as string]: i }}
                onClick={() => {
                  // 멀리서 누르면 먼저 그 장소로 다가가고, 가까이서 누르면 등불을 열어요
                  if (far) flyTo(lookAt(info.cx, 560, placeScale(sizeRef.current)));
                  else onPick(l.user_id);
                }}
                onFocus={() => {
                  const v = viewRef.current, sx = x * v.s + v.x;
                  if (sx < 40 || sx > sizeRef.current.w - 40) flyTo(lookAt(x, 560, Math.max(v.s, placeScale(sizeRef.current))));
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
