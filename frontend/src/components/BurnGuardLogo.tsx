import React from 'react';

interface BurnGuardLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BurnGuardLogo: React.FC<BurnGuardLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const iconDimensions = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }[size];

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }[size];

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Icon Graphic */}
      <div className={`relative ${iconDimensions} flex-shrink-0 flex items-center justify-center`}>
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 opacity-80 blur-[6px] animate-pulse-signal" />
        
        {/* Shield + Microchip Container */}
        <div className="relative h-full w-full rounded-xl bg-slate-950 dark:bg-slate-950 border border-cyan-500/40 p-1.5 flex items-center justify-center shadow-lg overflow-hidden">
          {/* Subtle PCB Trace Background inside logo */}
          <svg className="absolute inset-0 w-full h-full opacity-30 text-cyan-400" viewBox="0 0 40 40" fill="none">
            <path d="M0 10H10V20H20V40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
            <path d="M40 30H30V20H10" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <circle cx="20" cy="20" r="1.5" fill="currentColor" />
            <circle cx="30" cy="30" r="1.5" fill="currentColor" />
          </svg>

          {/* Central Shield + Microchip Combined SVG Icon */}
          <svg className="h-full w-full text-cyan-400 z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            {/* Shield Outline */}
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="text-cyan-400 stroke-cyan-400" fill="rgba(6, 182, 212, 0.12)" />
            {/* Microchip Body inside shield */}
            <rect x="8.5" y="7.5" width="7" height="7" rx="1.5" fill="rgba(99, 102, 241, 0.3)" stroke="currentColor" strokeWidth="1.2" />
            {/* Component Pins */}
            <path d="M10 5.5v2M14 5.5v2M10 14.5v2M14 14.5v2M6.5 10h2M6.5 12h2M15.5 10h2M15.5 12h2" strokeWidth="1.2" />
            {/* AI Neural Node Center */}
            <circle cx="12" cy="11" r="1.2" className="fill-emerald-400 text-emerald-400" />
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div>
        <div className="flex items-center space-x-1.5 leading-none">
          <span className={`${titleSizes} font-extrabold tracking-tight text-slate-900 dark:text-white font-sans`}>
            BurnGuard
          </span>
          <span className="text-xs font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
            AI
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1">
            Predictive Burn-In Screening
          </p>
        )}
      </div>
    </div>
  );
};
