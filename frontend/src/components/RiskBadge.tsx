import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Activity } from 'lucide-react';

interface RiskBadgeProps {
  status: 'SAFE' | 'MONITOR' | 'HIGH_RISK' | string;
  isAnomaly?: boolean;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ status, isAnomaly, score }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'SAFE':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          icon: ShieldCheck,
          label: 'SAFE'
        };
      case 'MONITOR':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
          icon: AlertTriangle,
          label: 'MONITOR'
        };
      case 'HIGH_RISK':
        return {
          bg: 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse',
          icon: AlertOctagon,
          label: 'HIGH RISK'
        };
      default:
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400',
          icon: ShieldCheck,
          label: status
        };
    }
  };

  const config = getBadgeStyle();
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-1.5 font-mono select-none">
      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
        {score !== undefined && <span className="ml-1 opacity-90">({score})</span>}
      </span>
      {isAnomaly && (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30">
          <Activity className="h-3 w-3" />
          <span>ANOMALY</span>
        </span>
      )}
    </div>
  );
};
