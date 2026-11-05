import { useEffect, useRef } from "react";

/** 밤하늘: 천천히 깜빡이는 별과 가끔 지나가는 별똥별 */
export function Sky() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    let shoot: { x: number; y: number; t: number } | null = null;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 2600);
      stars = Array.from({ length: n }, () => {
        const y = Math.pow(Math.random(), 1.6) * h; // 위로 갈수록 별이 많아요
        return { x: Math.random() * w, y, r: Math.random() < 0.08 ? 1.3 : 0.4 + Math.random() * 0.7, p: Math.random() * 6.3, s: 0.4 + Math.random() * 1.2 };
      });
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const fade = 1 - s.y / h; // 수평선 가까이는 흐려요
        const tw = still ? 0.8 : 0.55 + 0.45 * Math.sin(t / 1000 * s.s + s.p);
        ctx.globalAlpha = Math.max(0, fade * tw);
        ctx.fillStyle = "#FFF4DE";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!still) {
        if (!shoot && Math.random() < 0.0015) shoot = { x: w * (0.2 + Math.random() * 0.7), y: h * Math.random() * 0.35, t: 0 };
        if (shoot) {
          shoot.t += 1;
          const k = shoot.t / 50;
          const x = shoot.x - k * 160, y = shoot.y + k * 70;
          const g = ctx.createLinearGradient(x, y, x + 60, y - 26);
          g.addColorStop(0, "rgba(255,244,222,.9)");
          g.addColorStop(1, "rgba(255,244,222,0)");
          ctx.globalAlpha = Math.sin(Math.PI * k);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 60, y - 26);
          ctx.stroke();
          if (k >= 1) shoot = null;
        }
        raf = requestAnimationFrame(draw);
      }
      ctx.globalAlpha = 1;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw(0);
    });
    ro.observe(cv);
    if (still) draw(0);
    else raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="sky" aria-hidden="true">
      <canvas ref={ref} />
      <span className="moon" />
      <span className="mist" />
    </div>
  );
}
