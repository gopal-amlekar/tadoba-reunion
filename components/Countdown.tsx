"use client";

import { useEffect, useState } from "react";

function parts(msLeft: number) {
  const s = Math.max(0, Math.floor(msLeft / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function Countdown({ target }: { target: string }) {
  // Start empty so the server and the first client render agree; the real
  // numbers land on the first tick.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const at = new Date(target).getTime();
    const tick = () => setLeft(at - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  const { days, hours, minutes, seconds } = parts(left ?? 0);
  const cells = [
    { value: days, label: "days" },
    { value: hours, label: "hours" },
    { value: minutes, label: "mins" },
    { value: seconds, label: "secs" },
  ];

  if (left !== null && left <= 0) {
    return (
      <p className="font-display text-2xl font-bold text-tiger">
        We&apos;re there! 🐾
      </p>
    );
  }

  return (
    <div className="flex gap-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="min-w-[68px] rounded-xl border border-jungle-700 bg-jungle-900/70 px-3 py-2 text-center"
        >
          <div className="font-display text-2xl font-bold tabular-nums text-amber-glow">
            {left === null ? "—" : String(c.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-bone-dim">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
