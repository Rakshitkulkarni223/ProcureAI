import React, { useEffect, useState } from 'react';
import { Boxes } from 'lucide-react';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    try {
      const t1 = setTimeout(() => setFadeOut(true), 2400);
      const t2 = setTimeout(() => onFinish(), 3200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } catch {
      onFinish();
    }
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      }}
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-[0_0_40px_rgba(5,150,105,0.4)]">
        <Boxes size={32} className="text-white" />
      </div>

      {/* Title */}
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-100" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        ProcureAI
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
        Vendor Intelligence Platform
      </p>

      {/* Tagline */}
      <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-slate-400">
        AI-powered procurement comparison engine — search once, compare suppliers, get explainable recommendations.
      </p>
    </div>
  );
}
