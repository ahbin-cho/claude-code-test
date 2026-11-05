import { useEffect, useRef, useState } from "react";
import type { Lantern } from "../lib/supabase";
import { daysLeft, ddayText, progressOf, titleOf } from "../lib/waiting";

const GAP = 88;
const EDGE = 56;

export function Harbor({ lanterns, me, online, pulseId, empty, onPick }: {
  lanterns: Lantern[];
  me: string | null;
  online: Set<string>;
  pulseId: string | null;
  empty: string;
  onPick: (id: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(360);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVw(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const span = lanterns.length * GAP;
  const width = Math.max(vw, EDGE + span);
  const offset = span < width ? (width - span - 40) / 2 : 0;

  return (
    <div className="harbor" ref={box}>
      <div className="pier" style={{ width }}>
        <div className="horizon" />
        <div className="deck" />
        {lanterns.length === 0 && <p className="empty">{empty}</p>}
        {lanterns.map((l, i) => {
          const x = EDGE + i * GAP + offset;
          const n = daysLeft(l);
          const home = n != null && n <= 0;
          const glow = home ? 1 : 0.3 + 0.7 * progressOf(l);
          const cls = ["lantern", l.user_id === me && "mine", online.has(l.user_id) && "here", home && "home", pulseId === l.user_id && "pulse"]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={l.user_id}>
              <span className="reflect" style={{ left: x, opacity: 0.12 + 0.35 * glow }} />
              <button className={cls} style={{ left: x }} onClick={() => onPick(l.user_id)} aria-label={`${titleOf(l)}, ${ddayText(n)}`}>
                <span className="label">
                  {l.who}
                  <span className="dd">{ddayText(n)}</span>
                </span>
                <span
                  className="lamp"
                  style={{
                    opacity: 0.45 + 0.55 * glow,
                    boxShadow: `0 0 ${8 + 28 * glow}px ${4 + 10 * glow}px rgba(242,180,90,${0.25 + 0.5 * glow})`,
                  }}
                />
                <span className="post" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
