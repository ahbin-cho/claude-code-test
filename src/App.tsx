import { useCallback, useState } from "react";
import { World, type Focus } from "./components/World";
import { PLACES, placeOf } from "./lib/places";
import { LanternDetail } from "./components/LanternDetail";
import { LanternForm } from "./components/LanternForm";
import { Sheet } from "./components/Sheet";
import { Sky } from "./components/Sky";
import { demo, useHarbor } from "./hooks/useHarbor";

type View = { type: "none" } | { type: "detail"; id: string } | { type: "form" };

export default function App() {
  const [view, setView] = useState<View>({ type: "none" });
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [hint, setHint] = useState(
    demo ? "체험 모드예요. 불빛을 누르면 가까이 다가가요. 새로고침하면 처음으로 돌아가요." : "불빛을 누르면 가까이 다가가요. 끌어서 둘러볼 수도 있어요.",
  );

  const pulse = useCallback((id: string) => {
    setPulseId(null);
    requestAnimationFrame(() => setPulseId(id));
    setTimeout(() => setPulseId((p) => (p === id ? null : p)), 1300);
  }, []);

  const h = useHarbor(() => {
    setHint("누군가 내 등불에 온기를 보냈어요.");
    if (h.me) pulse(h.me);
  });

  const mine = h.lanterns.find((l) => l.user_id === h.me);
  const picked = view.type === "detail" ? h.lanterns.find((l) => l.user_id === view.id) : undefined;
  const close = useCallback(() => setView({ type: "none" }), []);

  const empty =
    h.status === "unconfigured" ? "Supabase 설정이 아직 없어요. README의 1~3단계를 따라 .env 파일을 만들어주세요."
    : h.status === "error" ? "항구에 연결하지 못했어요. 인터넷 연결을 확인하고 새로고침해주세요."
    : h.status === "loading" ? "등불을 불러오는 중이에요."
    : "아직 걸린 등불이 없어요. 첫 등불을 걸어보세요.";

  return (
    <div className={`scene${view.type === "detail" ? " focusing" : ""}`}>
      <Sky />
      <World lanterns={h.lanterns} me={h.me} online={h.online} pulseId={pulseId} focus={focus} selectedId={view.type === "detail" ? view.id : null} onPick={(id) => setView({ type: "detail", id })} />

      <header>
        <h1>기다림 항구</h1>
        <p className="lede">돌아올 사람을 기다리며 등불을 걸어두는 곳. 그날이 가까워질수록 불빛이 밝아져요.</p>
        <p className="stats">오늘 밤 {h.hereCount}명이 와 있고, 등불 {h.lanterns.length}개가 걸려 있어요.</p>
        <nav className="places" aria-label="장소로 이동">
          <button className="place" onClick={() => setFocus({ place: "all", n: Date.now() })}>전체</button>
          {PLACES.map((p) => (
            <button key={p} className="place" onClick={() => setFocus({ place: p, n: Date.now() })}>
              {p} <small>{h.lanterns.filter((l) => placeOf(l.place) === p).length}</small>
            </button>
          ))}
        </nav>
      </header>
      {h.status !== "ready" || !h.lanterns.length ? <p className="empty">{empty}</p> : null}

      <div className="bar">
        <span className="hint">{hint}</span>
        <button className="btn" disabled={h.status !== "ready"} onClick={() => setView(mine ? { type: "detail", id: mine.user_id } : { type: "form" })}>
          {mine ? "내 등불 보기" : "내 등불 걸기"}
        </button>
      </div>

      <Sheet open={view.type !== "none"} onClose={close} labelledBy="sheet-title">
        {view.type === "form" && (
          <LanternForm initial={mine} onSave={h.saveLantern} onRemove={h.removeLantern} onClose={close} />
        )}
        {view.type === "detail" && picked && (
          <LanternDetail
            lantern={picked}
            isMine={picked.user_id === h.me}
            isHere={h.online.has(picked.user_id)}
            warmth={h.warmthCount.get(picked.user_id) ?? 0}
            sent={h.sentToday(picked.user_id)}
            onWarm={async () => {
              await h.sendWarmth(picked.user_id);
              pulse(picked.user_id);
            }}
            onEdit={() => setView({ type: "form" })}
            onClose={close}
          />
        )}
      </Sheet>
    </div>
  );
}
