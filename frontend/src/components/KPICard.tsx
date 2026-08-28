import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: LucideIcon;
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'pink' | 'cyan';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  colorTheme = 'indigo'
}) => {
  const themeMap = {
    indigo: {
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      text: 'text-amber-600 dark:text-amber-400'
    },
    rose: {
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      text: 'text-rose-600 dark:text-rose-400'
    },
    pink: {
      border: 'border-pink-500/30',
      bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      text: 'text-pink-600 dark:text-pink-400'
    },
    cyan: {
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      text: 'text-cyan-600 dark:text-cyan-400'
    }
  };

  const theme = themeMap[colorTheme];

  return (
    <div className="eng-card eng-card-hover p-5 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-1.5">
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl border ${theme.border} ${theme.bg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
        {subtitle && <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>}
        {trend && <span className={`font-semibold ${theme.text}`}>{trend}</span>}
      </div>
    </div>
  );
};
