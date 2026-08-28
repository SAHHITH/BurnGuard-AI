import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ZAxis, Cell } from 'recharts';
import { Activity, Cpu } from 'lucide-react';
import { api } from '../services/api';
import type { ComponentSummary } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AnomalyScatterPlotProps {
  onSelectComponent?: (comp_id: string) => void;
}

export const AnomalyScatterPlot: React.FC<AnomalyScatterPlotProps> = ({ onSelectComponent }) => {
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    fetchScatterData();
  }, []);

  const fetchScatterData = async () => {
    setLoading(true);
    try {
      const res = await api.getComponents(1, 100, undefined, undefined, undefined, 'risk_score', true);
      setComponents(res.items);
    } catch (err) {
      console.error('Failed to load scatter data:', err);
    } finally {
      setLoading(false);
    }
  };

  const scatterData = components.map((comp) => {
    const driftRate = parseFloat((comp.value_24h - comp.value_0h).toFixed(2));
    let color = '#10b981'; // Green (Safe)
    if (comp.status === 'HIGH_RISK' || comp.is_anomaly) {
      color = '#ef4444'; // Red (Anomaly/High Risk)
    } else if (comp.status === 'MONITOR') {
      color = '#f59e0b'; // Amber (Monitor)
    }

    return {
      x: comp.value_0h,
      y: driftRate,
      z: comp.risk_score,
      component_id: comp.component_id,
      lot_id: comp.lot_id,
      predicted_168h: comp.predicted_value_168h,
      risk_score: comp.risk_score,
      status: comp.status,
      is_anomaly: comp.is_anomaly,
      color
    };
  });

  const gridColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#475569';
  const tooltipBg = resolvedTheme === 'dark' ? '#0e1525' : '#ffffff';
  const tooltipBorder = resolvedTheme === 'dark' ? '#1e293b' : '#cbd5e1';
  const tooltipText = resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a';

  return (
    <div className="eng-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-rose-500" />
          <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
            Component Anomaly Scatter Space (Baseline Current vs 24h Parameter Drift)
          </h3>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 dark:text-slate-300">Safe Unit</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 dark:text-slate-300">Drift Monitor</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600 dark:text-slate-300">High Risk / Anomaly</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center font-mono text-xs text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mr-3"></div>
          Mapping telemetry scatter coordinates...
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                type="number"
                dataKey="x"
                name="Baseline Value (0h)"
                unit="µA"
                stroke={axisColor}
                fontSize={11}
                label={{ value: 'Baseline Current 0h (µA)', position: 'bottom', offset: 0, fill: axisColor, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="24h Drift Rate"
                unit="µA"
                stroke={axisColor}
                fontSize={11}
                label={{ value: '24h Drift (µA)', angle: -90, position: 'insideLeft', fill: axisColor, fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="z" range={[40, 200]} name="Risk Score" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        className="p-3 rounded-xl shadow-xl font-mono text-xs space-y-1.5 border"
                        style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }}
                      >
                        <div className="flex items-center space-x-2 border-b pb-1">
                          <Cpu className="h-4 w-4 text-cyan-500" />
                          <span className="font-bold">{data.component_id}</span>
                          <span className="text-[10px] text-slate-400">({data.lot_id})</span>
                        </div>
                        <div>Status: <span className="font-bold" style={{ color: data.color }}>{data.status}</span></div>
                        <div>0h Baseline: <span className="font-bold">{data.x} µA</span></div>
                        <div>24h Drift: <span className="font-bold">{data.y} µA</span></div>
                        <div>Pred. 168h: <span className="font-bold">{data.predicted_168h} µA</span></div>
                        <div>Risk Score: <span className="font-bold" style={{ color: data.color }}>{data.risk_score} / 100</span></div>
                        {onSelectComponent && (
                          <div className="pt-1 text-[10px] text-cyan-500 font-semibold underline cursor-pointer">
                            Click to Inspect XAI
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Components"
                data={scatterData}
                onClick={(e: any) => {
                  if (e && e.payload && e.payload.component_id && onSelectComponent) {
                    onSelectComponent(e.payload.component_id);
                  }
                }}
                className="cursor-pointer"
              >
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
