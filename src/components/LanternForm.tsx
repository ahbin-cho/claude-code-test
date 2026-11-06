import { useState } from "react";
import type { Lantern } from "../lib/supabase";
import { KINDS, parseDate, today, ymd } from "../lib/waiting";
import { PLACES, PLACE_INFO, placeOf } from "../lib/places";

type Values = Pick<Lantern, "who" | "kind" | "start_date" | "end_date" | "line" | "place">;

export function LanternForm({ initial, onSave, onRemove, onClose }: {
  initial?: Lantern;
  onSave: (v: Values) => Promise<void>;
  onRemove: () => Promise<void>;
  onClose: () => void;
}) {
  const [who, setWho] = useState(initial?.who ?? "");
  const [kind, setKind] = useState(initial?.kind ?? KINDS[0]);
  const [start, setStart] = useState(initial?.start_date ?? ymd(today()));
  const [end, setEnd] = useState(initial?.end_date ?? "");
  const [line, setLine] = useState(initial?.line ?? "");
  const [place, setPlace] = useState(placeOf(initial?.place));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!who.trim()) return setErr("기다리는 사람의 이름을 적어주세요.");
    if (!end) return setErr("돌아오는 날을 골라주세요.");
    const s = parseDate(start), e = parseDate(end);
    if (s && e && e <= s) return setErr("돌아오는 날은 시작한 날보다 뒤여야 해요.");
    setBusy(true);
    setErr("");
    try {
      await onSave({ who: who.trim(), kind, start_date: start, end_date: end, line: line.trim(), place });
      onClose();
    } catch {
      setErr("저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.");
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await onRemove();
      onClose();
    } catch {
      setErr("등불을 내리지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <>
      <h2 id="sheet-title">{initial ? "내 등불" : "등불 걸기"}</h2>
      <div className="small">이름은 다른 사람에게 그대로 보여요. 애칭이나 이니셜도 괜찮아요.</div>

      <label htmlFor="who">누구를 기다리나요</label>
      <input id="who" maxLength={10} value={who} onChange={(e) => setWho(e.target.value)} placeholder="예: 지수, 우리 아빠" />

      <span className="label-text">어떤 기다림인가요</span>
      <div className="chips">
        {KINDS.map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={k === kind} onClick={() => setKind(k)}>{k}</button>
        ))}
      </div>

      <span className="label-text">어디에 걸까요</span>
      <div className="chips">
        {PLACES.map((p) => (
          <button key={p} type="button" className="chip" aria-pressed={p === place} onClick={() => setPlace(p)}>{p}</button>
        ))}
      </div>
      <div className="small place-blurb">{PLACE_INFO[place].blurb}</div>

      <div className="two">
        <div>
          <label htmlFor="sd">기다리기 시작한 날</label>
          <input id="sd" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ed">돌아오는 날</label>
          <input id="ed" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <label htmlFor="line">오늘의 한 줄</label>
      <textarea id="line" maxLength={60} value={line} onChange={(e) => setLine(e.target.value)} placeholder="예: 오늘 편지가 왔다. 밥은 잘 먹는대." />

      <div className="err" role="alert">{err}</div>
      <div className="row">
        <button className="btn" onClick={save} disabled={busy}>{initial ? "저장하기" : "등불 걸기"}</button>
        {initial && <button className="ghost" onClick={remove} disabled={busy}>등불 내리기</button>}
        <button className="ghost" onClick={onClose}>닫기</button>
      </div>
    </>
  );
}
