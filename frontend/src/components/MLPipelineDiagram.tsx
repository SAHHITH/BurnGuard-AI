import React from 'react';
import { Database, ShieldCheck, Cpu, GitBranch, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

export const MLPipelineDiagram: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: 'CSV / Telemetry Data',
      desc: 'Raw burn-in measurements (0h, 24h)',
      icon: Database,
      color: 'border-cyan-500/40 text-cyan-500 bg-cyan-500/10'
    },
    {
      id: 2,
      title: 'Data Validation',
      desc: 'Schema check & outlier bounds',
      icon: ShieldCheck,
      color: 'border-indigo-500/40 text-indigo-500 bg-indigo-500/10'
    },
    {
      id: 3,
      title: 'Feature Engineering',
      desc: 'Drift rates, lot Z-scores & slopes',
      icon: Cpu,
      color: 'border-purple-500/40 text-purple-500 bg-purple-500/10'
    },
    {
      id: 4,
      title: 'ML Dual Engine',
      desc: 'Isolation Forest + Ridge Forecast',
      icon: GitBranch,
      color: 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
    },
    {
      id: 5,
      title: 'Hybrid Risk Scoring',
      desc: 'Normalized score (0-100)',
      icon: AlertTriangle,
      color: 'border-amber-500/40 text-amber-500 bg-amber-500/10'
    },
    {
      id: 6,
      title: 'Explainable AI (XAI)',
      desc: 'SHAP attributions & reason codes',
      icon: Lightbulb,
      color: 'border-cyan-500/40 text-cyan-500 bg-cyan-500/10'
    },
    {
      id: 7,
      title: 'Final Screening Decision',
      desc: 'Pass / Monitor / Reject',
      icon: CheckCircle,
      color: 'border-rose-500/40 text-rose-500 bg-rose-500/10'
    }
  ];

  return (
    <div className="eng-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-cyan-500" />
            <span>BurnGuard AI Reliability Architecture & Telemetry Pipeline</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            End-to-end signal processing, machine learning feature extraction, and explainable decision engine.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">Signal Flow Active</span>
        </div>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative group flex flex-col items-center">
              {/* Step Card */}
              <div className={`w-full eng-card p-3 flex flex-col items-center text-center space-y-2 border ${step.color} transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}>
                <div className={`p-2 rounded-xl border ${step.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {step.title}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Connecting Pulse Line (on desktop) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="w-3 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
