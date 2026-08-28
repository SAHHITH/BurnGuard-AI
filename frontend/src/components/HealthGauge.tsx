import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface HealthGaugeProps {
  score: number; // 0 to 100
  status: 'SAFE' | 'MONITOR' | 'HIGH_RISK' | string;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ score, status }) => {
  // Clamp score between 0 and 100
  const clampedScore = Math.min(Math.max(score, 0), 100);
  
  // Calculate needle angle (-90deg to +90deg)
  const angle = -90 + (clampedScore / 100) * 180;

  const getStatusDetails = () => {
    if (clampedScore > 60 || status === 'HIGH_RISK') {
      return {
        label: 'HIGH RISK',
        color: 'text-rose-500 dark:text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/30',
        icon: AlertOctagon,
        recommendation: 'Immediate Quarantine & Early Rejection Recommended'
      };
    }
    if (clampedScore > 30 || status === 'MONITOR') {
      return {
        label: 'MONITOR',
        color: 'text-amber-500 dark:text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/30',
        icon: AlertTriangle,
        recommendation: 'Extended 96h Testing & Parameter Surveillance'
      };
    }
    return {
      label: 'SAFE',
      color: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      icon: ShieldCheck,
      recommendation: 'Passed Burn-In Screening - Approved for Assembly'
    };
  };

  const details = getStatusDetails();
  const Icon = details.icon;

  return (
    <div className="eng-card p-5 flex flex-col items-center justify-between space-y-4 text-center relative overflow-hidden">
      <div className="w-full flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
        <span>Component Health Meter</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">Industrial Test Bench v2.4</span>
      </div>

      {/* Semi-Circle Engineering Dial */}
      <div className="relative w-48 h-24 flex items-end justify-center overflow-hidden">
        {/* Arc Background */}
        <svg className="w-48 h-48 -mb-24" viewBox="0 0 100 100">
          {/* Safe Segment */}
          <path
            d="M 10,50 A 40,40 0 0,1 36.5,15.3"
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Monitor Segment */}
          <path
            d="M 39.5,13.5 A 40,40 0 0,1 60.5,13.5"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="8"
            opacity="0.85"
          />
          {/* High Risk Segment */}
          <path
            d="M 63.5,15.3 A 40,40 0 0,1 90,50"
            fill="none"
            stroke="#ef4444"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>

        {/* Dial Needle */}
        <div
          className="absolute bottom-0 left-1/2 w-1 h-20 bg-slate-800 dark:bg-white origin-bottom transition-transform duration-700 ease-out shadow-lg"
          style={{
            transform: `translateX(-50%) rotate(${angle}deg)`
          }}
        >
          <div className="w-3 h-3 rounded-full bg-cyan-500 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md shadow-cyan-500/50" />
        </div>

        {/* Center Pivot Point */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center shadow-md">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
        </div>
      </div>

      {/* Score and Status Text */}
      <div className="space-y-1 pt-2">
        <div className="flex items-center justify-center space-x-2">
          <Icon className={`h-5 w-5 ${details.color}`} />
          <span className={`text-xl font-bold font-mono ${details.color}`}>{details.label}</span>
          <span className="text-sm font-mono text-slate-500 dark:text-slate-400">({clampedScore} / 100)</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">{details.recommendation}</p>
      </div>
    </div>
  );
};
