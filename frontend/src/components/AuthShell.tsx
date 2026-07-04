import React from 'react';
import { Boxes, ShieldCheck, Sparkles, TrendingDown } from 'lucide-react';

const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400';

export function AuthShell({ children }: { children: React.ReactNode }) {
  try {
    return (
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand / image panel — always dark regardless of theme */}
        <div className="relative hidden overflow-hidden lg:block" style={{ background: '#0F172A' }}>
          <img src={AUTH_IMAGE} alt="Procurement warehouse" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0F172A, rgba(15,23,42,0.7), rgba(15,23,42,0.3))' }} />
          <div className="relative flex h-full flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white">
                <Boxes size={20} />
              </span>
              <span className="font-display text-xl font-bold tracking-tight">ProcureAI</span>
            </div>

            <div className="max-w-md">
              <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
                Search once. Compare every supplier. Decide with confidence.
              </h1>
              <p className="mt-4 text-sm text-white/70">
                An AI-native procurement intelligence platform that scores suppliers on price, delivery, reliability
                and availability — and tells you exactly why.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  { icon: Sparkles, text: 'Explainable AI recommendations with confidence scores' },
                  { icon: TrendingDown, text: 'Quantified savings across every comparison' },
                  { icon: ShieldCheck, text: 'Configurable weight profiles per business type' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-white/85">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
                      <f.icon size={14} />
                    </span>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="data-num text-xs tracking-widest text-white/40">
              PHASE 1 · MOCK PROVIDER ADAPTERS · API-READY
            </div>
          </div>
        </div>

        {/* Form panel — adapts to light/dark */}
        <div className="flex items-center justify-center bg-bg px-6 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}
