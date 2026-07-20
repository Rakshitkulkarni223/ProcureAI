import React from 'react';
import { Boxes, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';

export function AuthShell({ children }: { children: React.ReactNode }) {
  try {
    return (
      <div className="min-h-screen bg-[#07111f] p-3 sm:p-5 lg:p-6">
        <div className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1729] shadow-[0_28px_80px_rgba(0,0,0,0.35)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.15fr_0.85fr]">
        {/* Brand / image panel — always dark regardless of theme */}
        <div className="relative hidden overflow-hidden bg-[#07111f] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(16,185,129,0.19),transparent_28%),radial-gradient(circle_at_80%_76%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(135deg,#07111f_0%,#0a1d2f_100%)]" />
          <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.24)_1px,transparent_1px)] [background-size:52px_52px]" />
          <div className="absolute left-[14%] top-[29%] h-px w-[63%] rotate-[26deg] bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <div className="absolute left-[24%] top-[62%] h-px w-[54%] -rotate-[32deg] bg-gradient-to-r from-transparent via-sky-300/50 to-transparent" />
          <div className="absolute left-[47%] top-[22%] h-[51%] w-px rotate-[30deg] bg-gradient-to-b from-transparent via-emerald-300/40 to-transparent" />
          <div className="absolute left-[13%] top-[27%] flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_44px_rgba(16,185,129,0.2)] backdrop-blur-xl"><Boxes size={24} /></div>
          <div className="absolute left-[69%] top-[39%] flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300 shadow-[0_0_40px_rgba(56,189,248,0.16)] backdrop-blur-xl"><Sparkles size={20} /></div>
          <div className="absolute left-[35%] top-[68%] flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 backdrop-blur-xl"><TrendingDown size={19} /></div>
          <div className="absolute right-[9%] top-[12%] w-48 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /><span className="h-1.5 w-12 rounded-full bg-slate-600" /></div>
            <div className="mt-4 flex items-end gap-1.5"><span className="h-6 w-3 rounded-sm bg-emerald-400/30" /><span className="h-10 w-3 rounded-sm bg-emerald-400/50" /><span className="h-8 w-3 rounded-sm bg-sky-400/50" /><span className="h-14 w-3 rounded-sm bg-emerald-300" /><span className="h-11 w-3 rounded-sm bg-sky-300/60" /></div>
          </div>
          <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_10px_24px_rgba(16,185,129,0.3)]">
                <Boxes size={20} />
              </span>
              <span className="font-display text-xl font-bold tracking-tight">Procure<span className="text-emerald-400">AI</span></span>
            </div>

            <div className="max-w-lg">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Sparkles size={12} /> AI Procurement Intelligence
              </div>
              <h1 className="font-display text-5xl font-extrabold leading-[1.06] tracking-tight xl:text-6xl">
                <span className="block">Search once.</span>
                <span className="block">Compare every supplier.</span>
                <span className="block text-emerald-300">Procure smarter.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300/80">
                Compare suppliers, optimize every purchase, and understand every recommendation with explainable AI.
              </p>
              <div className="mt-9 grid gap-2.5">
                {[
                  { icon: Sparkles, text: 'Explainable AI recommendations with confidence scores' },
                  { icon: TrendingDown, text: 'Track measurable procurement savings and business impact' },
                  { icon: ShieldCheck, text: 'Configurable weight profiles per business type' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.055] px-3.5 py-3 text-sm text-white/85 backdrop-blur-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                      <f.icon size={14} />
                    </span>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="data-num text-[10px] tracking-[0.2em] text-white/40">
              Procurement Intelligence • Explainable AI • Business Impact
            </div>
          </div>
        </div>

        {/* Form panel — adapts to light/dark */}
        <div className="relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_78%_16%,rgba(16,185,129,0.1),transparent_30%),#0b1729] px-6 py-12 sm:px-10">
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(148,163,184,0.7)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative w-full max-w-md rounded-[1.5rem] border border-white/10 bg-slate-950/25 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-9">{children}</div>
        </div>
      </div>
      </div>
    );
  } catch {
    return null;
  }
}
