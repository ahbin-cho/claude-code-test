import { useState } from "react";
import type { Lantern } from "../lib/supabase";
import { daysLeft, ddayText, progressOf, titleOf } from "../lib/waiting";

export function LanternDetail({ lantern, isMine, isHere, warmth, sent, onWarm, onEdit, onClose }: {
  lantern: Lantern;
  isMine: boolean;
  isHere: boolean;
  warmth: number;
  sent: boolean;
  onWarm: () => Promise<void>;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const n = daysLeft(lantern);
  const pct = Math.round(progressOf(lantern) * 100);

  async function warm() {
    setBusy(true);
    setErr("");
    try {
      await onWarm();
    } catch {
      setErr("온기를 보내지 못했어요. 잠시 뒤 다시 눌러주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2 id="sheet-title">{titleOf(lantern)}</h2>
      <div className="kind">
        {lantern.kind}
        {isHere && ", 지금 항구에 있어요"}
      </div>
      <div className="big">{ddayText(n)}</div>
      <div className="prog"><i style={{ width: `${pct}%` }} /></div>
      <div className="small">{n != null && n <= 0 ? "긴 기다림을 끝냈어요." : `기다림의 ${pct}%를 지나왔어요.`}</div>
      {lantern.line && <blockquote>{lantern.line}</blockquote>}
      <div className="small">받은 온기 {warmth}</div>
      <div className="err" role="alert">{err}</div>
      <div className="row">
        {isMine ? (
          <button className="btn" onClick={onEdit}>한 줄 고치기</button>
        ) : (
          <button className="btn" onClick={warm} disabled={busy || sent}>
            {sent ? "오늘 온기를 보냈어요" : "온기 보내기"}
          </button>
        )}
        <button className="ghost" onClick={onClose}>닫기</button>
      </div>
    </>
  );
}
