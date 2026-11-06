import { useState } from "react";
import type { Lantern } from "../lib/supabase";
import { daysLeft, ddayText, progressOf, titleOf } from "../lib/waiting";
import { placeOf } from "../lib/places";

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
        {lantern.kind}, {placeOf(lantern.place)}에 걸려 있어요
        {isHere && <span className="here-now">지금 여기 와 있어요</span>}
      </div>
      <div className="big">{ddayText(n)}</div>
      <div className="small">{n != null && n <= 0 ? "긴 기다림을 끝냈어요." : `${lantern.start_date.split("-").join(".")}부터, 기다림의 ${pct}%를 지나왔어요.`}</div>
      {lantern.line && <p className="note-line">{lantern.line}</p>}
      <div className="small">{warmth ? `온기를 ${warmth}번 받았어요.` : "아직 받은 온기가 없어요."}</div>
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
