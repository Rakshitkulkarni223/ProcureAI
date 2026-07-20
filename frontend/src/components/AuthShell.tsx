import React from 'react';
import { Boxes, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';

export function AuthShell({ children }: { children: React.ReactNode }) {
  try {
    return (
      <div className="auth-shell min-h-screen bg-[#050816] p-3 sm:p-5 lg:p-6">
        <div className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1729] shadow-[0_28px_80px_rgba(0,0,0,0.35)] xl:min-h-[calc(100vh-3rem)] xl:grid-cols-[1.05fr_0.95fr]">
        {/* Brand / image panel — always dark regardless of theme */}
        <div className="relative hidden overflow-hidden bg-[#070b1d] xl:block">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_4%,rgba(45,212,191,0.22),transparent_38%),radial-gradient(ellipse_at_92%_80%,rgba(59,130,246,0.2),transparent_42%),radial-gradient(ellipse_at_45%_100%,rgba(139,92,246,0.12),transparent_46%),linear-gradient(145deg,#070b1d_0%,#0c1530_55%,#07101f_100%)]" />
          <div className="absolute -left-36 top-[18%] h-[36rem] w-[36rem] rounded-full border border-emerald-300/[0.11]" />
          <div className="absolute -left-20 top-[25%] h-[28rem] w-[28rem] rounded-full border border-sky-300/[0.10]" />
          <div className="absolute right-[-13rem] top-[-10rem] h-[35rem] w-[35rem] rounded-full border border-violet-300/[0.10]" />
          <div className="absolute left-[16%] top-[38%] h-44 w-44 rounded-full bg-emerald-400/[0.12] blur-3xl" />
          <div className="absolute right-[7%] bottom-[14%] h-44 w-44 rounded-full bg-sky-400/[0.12] blur-3xl" />
          <div className="absolute left-[13%] top-[27%] flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_44px_rgba(16,185,129,0.2)] backdrop-blur-xl"><Boxes size={24} /></div>
          <div className="absolute right-[8%] top-[35%] flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300 shadow-[0_0_40px_rgba(56,189,248,0.16)] backdrop-blur-xl"><Sparkles size={20} /></div>
          <div className="absolute left-[35%] top-[68%] flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 backdrop-blur-xl"><TrendingDown size={19} /></div>
          <div className="absolute right-[9%] top-[12%] w-48 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="h-1.5 w-12 rounded-full bg-slate-600" />
            </div>
            <div className="mt-4 flex items-end gap-1.5">
              <span className="h-6 w-3 rounded-sm bg-emerald-400/30" />
              <span className="h-10 w-3 rounded-sm bg-emerald-400/50" />
              <span className="h-8 w-3 rounded-sm bg-sky-400/50" />
              <span className="h-14 w-3 rounded-sm bg-emerald-300" />
              <span className="h-11 w-3 rounded-sm bg-sky-300/60" />
            </div>
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
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.23em] text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.08)]">
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
                  { icon: Sparkles, text: 'Explainable AI with confidence scoring' },
                  { icon: TrendingDown, text: 'Track procurement savings and business impact' },
                  { icon: ShieldCheck, text: 'Customizable decision models for every business' },
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
        <div className="relative flex min-h-[calc(100vh-1.5rem)] items-start justify-center overflow-hidden bg-[radial-gradient(ellipse_at_84%_12%,rgba(45,212,191,0.14),transparent_32%),radial-gradient(ellipse_at_18%_90%,rgba(59,130,246,0.12),transparent_38%),linear-gradient(145deg,#0c1530,#070b1d)] px-6 py-8 sm:items-center sm:px-10 sm:py-12 xl:min-h-0 xl:px-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-emerald-300/[0.09]" />
          <div className="absolute -bottom-36 -left-28 h-80 w-80 rounded-full border border-sky-300/[0.08]" />
          <div className="relative w-full max-w-lg rounded-[1.5rem] border border-white/10 bg-slate-950/25 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-9 xl:max-w-md">{children}</div>
        </div>
      </div>
      </div>
    );
  } catch {
    return null;
  }
}
