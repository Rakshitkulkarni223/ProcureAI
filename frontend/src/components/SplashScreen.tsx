import React, { useEffect, useState } from 'react';
import { Boxes, Check, Sparkles, TrendingDown, Truck } from 'lucide-react';

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
      className={`fixed inset-0 z-[99999] isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] px-5 transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.2),transparent_26%),radial-gradient(circle_at_85%_78%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#07111f_0%,#0b1d2e_48%,#07111f_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -left-28 top-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

      <main className="relative w-full max-w-4xl">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/35 shadow-[0_32px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative px-7 py-10 sm:px-12 sm:py-14">
              <div className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-white/15 to-transparent lg:block" />
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Sparkles size={12} /> Procurement intelligence
              </div>

              <div className="mt-7 flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_48px_rgba(16,185,129,0.35)]">
                  <Boxes size={31} className="text-white" />
                  <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0b1d2e] bg-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Procure<span className="text-emerald-400">AI</span></h1>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Smarter spend, every time</p>
                </div>
              </div>

              <h2 className="mt-9 max-w-md text-2xl font-semibold leading-tight text-slate-100 sm:text-3xl">
                Turning purchase decisions into measurable advantage.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">
                Compare supplier options, optimise your basket, and act on clear procurement intelligence.
              </p>

              <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Preparing your workspace</span>
                <span className="h-px flex-1 bg-white/10" />
                <span className="font-medium text-emerald-300">Loading</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-300 to-sky-300 animate-pulse" />
              </div>
            </div>

            <div className="relative hidden min-h-[410px] overflow-hidden bg-white/[0.025] p-8 lg:block">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><TrendingDown size={19} /></span>
                    <div><p className="text-xs text-slate-400">Optimisation signal</p><p className="mt-0.5 text-sm font-semibold text-white">Best-value basket found</p></div>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">Ready</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl shadow-black/10">
                  <div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">Supplier network</span><span className="text-xs text-emerald-300">Live insights</span></div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3"><span className="h-8 w-8 rounded-lg bg-sky-400/15" /><div className="flex-1"><div className="h-2 w-24 rounded-full bg-slate-600" /><div className="mt-2 h-1.5 w-36 rounded-full bg-slate-700" /></div><span className="flex items-center gap-1 text-xs text-emerald-300"><Check size={12} /> Verified</span></div>
                    <div className="flex items-center gap-3"><span className="h-8 w-8 rounded-lg bg-violet-400/15" /><div className="flex-1"><div className="h-2 w-20 rounded-full bg-slate-600" /><div className="mt-2 h-1.5 w-28 rounded-full bg-slate-700" /></div><span className="flex items-center gap-1 text-xs text-slate-400"><Truck size={12} /> 2 days</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
