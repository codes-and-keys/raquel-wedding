'use client';

import { useEffect, useState } from 'react';

const WEDDING_DATE = new Date('2026-11-29T15:00:00-03:00');

function getTimeLeft() {
  const diff = WEDDING_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

const units = ['dias', 'horas', 'min', 'seg'] as const;

export default function CountdownTimer() {
  const [time, setTime] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const tick = () => setTime(getTimeLeft());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const values = time
    ? [time.days, time.hours, time.minutes, time.seconds]
    : [null, null, null, null];

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-3">
      {units.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-3">
          <div className="flex flex-col items-center w-12 sm:w-16">
            <span className="text-2xl sm:text-3xl font-serif text-primary tabular-nums leading-none">
              {values[i] !== null ? String(values[i]).padStart(2, '0') : '--'}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-xl text-primary/30 pb-4 select-none">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
