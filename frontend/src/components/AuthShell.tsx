import React from 'react';
import { Boxes, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400';

export function AuthShell({ children }: { children: React.ReactNode }) {
  try {
    return (
      <div className="min-h-screen bg-[#07111f] p-3 sm:p-5 lg:p-6">
        <div className="grid min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1729] shadow-[0_28px_80px_rgba(0,0,0,0.35)] lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.15fr_0.85fr]">
        {/* Brand / image panel — always dark regardless of theme */}
        <div className="relative hidden overflow-hidden lg:block" style={{ background: '#07111f' }}>
          <img src={AUTH_IMAGE} alt="Procurement warehouse" className="absolute inset-0 h-full w-full object-cover opacity-20 saturate-[0.7]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.25),transparent_30%),linear-gradient(125deg,rgba(7,17,31,0.96)_4%,rgba(7,17,31,0.74)_54%,rgba(5,29,42,0.8)_100%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:44px_44px]" />
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
                Search once. Compare every supplier. Decide with confidence.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-slate-300/80">
                An AI-powered procurement platform that compares suppliers, recommends the best purchasing
                decisions, and explains every recommendation.
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
