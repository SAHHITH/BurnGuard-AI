import React from 'react';

interface SignalTimelineProps {
  val0h?: number;
  val24h?: number;
  val96h?: number | null;
  val168h?: number | null;
  status: 'SAFE' | 'MONITOR' | 'HIGH_RISK' | string;
}

export const SignalTimeline: React.FC<SignalTimelineProps> = ({
  val0h = 10,
  val24h = 12,
  val96h = null,
  val168h = null,
  status
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'SAFE':
        return { dot: 'bg-emerald-500', line: 'bg-emerald-500/50', text: 'text-emerald-500' };
      case 'MONITOR':
        return { dot: 'bg-amber-500', line: 'bg-amber-500/50', text: 'text-amber-500' };
      case 'HIGH_RISK':
        return { dot: 'bg-rose-500', line: 'bg-rose-500/50', text: 'text-rose-500' };
      default:
        return { dot: 'bg-cyan-500', line: 'bg-cyan-500/50', text: 'text-cyan-500' };
    }
  };

  const style = getStatusColor();

  return (
    <div className="flex items-center space-x-2 font-mono text-[11px] select-none">
      {/* 0h */}
      <div className="flex flex-col items-center">
        <span className="text-slate-400 font-medium">0h</span>
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{val0h}µA</span>
      </div>

      <div className={`h-0.5 w-6 ${style.line}`} />

      {/* 24h */}
      <div className="flex flex-col items-center">
        <span className="text-slate-400 font-medium">24h</span>
        <div className={`h-2.5 w-2.5 rounded-full ${style.dot} ring-2 ring-cyan-500/20`} />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{val24h}µA</span>
      </div>

      <div className={`h-0.5 w-6 ${val96h !== null ? style.line : 'bg-slate-300 dark:bg-slate-700 stroke-dash'}`} />

      {/* 96h */}
      <div className="flex flex-col items-center">
        <span className="text-slate-400 font-medium">96h</span>
        <div className={`h-2.5 w-2.5 rounded-full ${val96h !== null ? style.dot : 'bg-slate-400 dark:bg-slate-700'}`} />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{val96h !== null ? `${val96h}µA` : '--'}</span>
      </div>

      <div className={`h-0.5 w-6 ${val168h !== null ? style.line : 'bg-slate-300 dark:bg-slate-700'}`} />

      {/* 168h */}
      <div className="flex flex-col items-center">
        <span className="text-slate-400 font-medium">168h</span>
        <div className={`h-2.5 w-2.5 rounded-full ${val168h !== null ? style.dot : 'bg-slate-400 dark:bg-slate-700'}`} />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{val168h !== null ? `${val168h}µA` : 'Pred'}</span>
      </div>
    </div>
  );
};
