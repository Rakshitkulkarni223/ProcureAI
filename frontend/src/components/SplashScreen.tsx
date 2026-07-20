import React, { useEffect, useState } from 'react';
import { Boxes, Check, Sparkles } from 'lucide-react';

const loadingSteps = [
  'Initializing AI Procurement Engine',
  'Loading procurement intelligence',
  'Connecting core services',
  'Preparing intelligent workflows',
  'Launching ProcureAI',
];

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    try {
      const interval = setInterval(() => {
        setActiveStep((current) => Math.min(current + 1, loadingSteps.length - 1));
      }, 600);
      const t1 = setTimeout(() => setFadeOut(true), 3500);
      const t2 = setTimeout(() => onFinish(), 4200);
      return () => {
        clearInterval(interval);
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
                <Sparkles size={12} /> AI procurement intelligence
              </div>

              <div className="mt-7 flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_48px_rgba(16,185,129,0.35)]">
                  <Boxes size={31} className="text-white" />
                  <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0b1d2e] bg-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Procure<span className="text-emerald-400">AI</span></h1>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Intelligence for every purchase</p>
                </div>
              </div>

              <h2 className="mt-9 max-w-md text-2xl font-semibold leading-tight text-slate-100 sm:text-3xl">
                AI-powered procurement decisions for every purchase.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">
                Compare supplier options, optimise your basket, and act on clear procurement intelligence.
              </p>

              <div className="mt-8 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span key={activeStep} className="font-medium text-slate-200 transition-opacity duration-300">{loadingSteps[activeStep]}...</span>
                <span className="h-px flex-1 bg-white/10" />
                <span className="font-medium text-emerald-300">{Math.round(((activeStep + 1) / loadingSteps.length) * 100)}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-300 to-sky-300 transition-all duration-500" style={{ width: `${((activeStep + 1) / loadingSteps.length) * 100}%` }} />
              </div>
            </div>

            <div className="relative hidden min-h-[410px] overflow-hidden bg-white/[0.025] p-8 lg:block">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
                <div className="mb-5 flex items-center justify-between">
                  <div><p className="text-xs font-semibold text-slate-200">Procurement Intelligence Engine</p><p className="mt-1 text-xs text-slate-400">Building your intelligence layer</p></div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Sparkles size={17} /></span>
                </div>
                <div className="space-y-2.5">
                  {loadingSteps.map((step, index) => {
                    const complete = index < activeStep;
                    const current = index === activeStep;
                    return (
                      <div key={step} className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-500 ${complete ? 'border-emerald-400/20 bg-emerald-400/[0.08]' : current ? 'border-sky-300/30 bg-sky-400/[0.08]' : 'border-white/5 bg-white/[0.02] opacity-40'}`}>
                        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${complete ? 'bg-emerald-400 text-slate-950' : current ? 'border-2 border-sky-300 border-t-transparent animate-spin text-sky-300' : 'border border-slate-600 text-slate-500'}`}>
                          {complete ? <Check size={14} strokeWidth={3} /> : !current && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        </span>
                        <span className={`text-xs font-medium ${complete ? 'text-emerald-200' : current ? 'text-sky-100' : 'text-slate-500'}`}>{step}</span>
                        {current && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-sky-300">Analysing</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
