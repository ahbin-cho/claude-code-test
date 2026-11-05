import { useCallback, useState } from "react";
import { Harbor } from "./components/Harbor";
import { LanternDetail } from "./components/LanternDetail";
import { LanternForm } from "./components/LanternForm";
import { Sheet } from "./components/Sheet";
import { Sky } from "./components/Sky";
import { demo, useHarbor } from "./hooks/useHarbor";

type View = { type: "none" } | { type: "detail"; id: string } | { type: "form" };

export default function App() {
  const [view, setView] = useState<View>({ type: "none" });
  const [pulseId, setPulseId] = useState<string | null>(null);
  const [hint, setHint] = useState(
    demo ? "체험 모드예요. 등불을 눌러보세요. 새로고침하면 처음으로 돌아가요." : "등불을 누르면 그 사람의 기다림을 볼 수 있어요.",
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
    <div className="scene">
      <Sky />
      <header>
        <p className="eyebrow">오늘 밤의 항구</p>
        <h1>기다림 항구</h1>
        <p className="lede">돌아올 사람을 기다리며 등불을 걸어두는 곳.<br />그날이 가까워질수록 불빛이 밝아져요.</p>
        <div className="stats">
          <span><span className="dot" />지금 항구에 <b>{h.hereCount}</b>명</span>
          <span>걸린 등불 <b>{h.lanterns.length}</b>개</span>
        </div>
      </header>

      <Harbor lanterns={h.lanterns} me={h.me} online={h.online} pulseId={pulseId} empty={empty} onPick={(id) => setView({ type: "detail", id })} />

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
