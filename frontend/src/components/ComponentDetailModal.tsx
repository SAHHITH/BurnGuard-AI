import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, Cpu, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import type { ComponentDetail } from '../types';
import { api } from '../services/api';
import { RiskBadge } from './RiskBadge';
import { HealthGauge } from './HealthGauge';
import { SignalTimeline } from './SignalTimeline';
import { useTheme } from '../context/ThemeContext';

interface ComponentDetailModalProps {
  componentId: string | null;
  onClose: () => void;
}

export const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({ componentId, onClose }) => {
  const [detail, setDetail] = useState<ComponentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!componentId) return;
    setLoading(true);
    setError(null);
    api.getComponentDetail(componentId)
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load component details.');
        setLoading(false);
      });
  }, [componentId]);

  if (!componentId) return null;

  const getChartData = () => {
    if (!detail) return [];
    const historyMap: Record<string, number> = {};
    detail.measurement_history.forEach(m => {
      historyMap[m.time_point] = m.value;
    });

    return [
      { time: '0h', actual: historyMap['0h'], forecast: null },
      { time: '24h', actual: historyMap['24h'], forecast: null },
      { time: '96h', actual: historyMap['96h'] ?? null, forecast: null },
      { 
        time: '168h', 
        actual: historyMap['168h'] ?? null, 
        forecast: detail.predicted_value_168h 
      },
    ];
  };

  const getShapData = () => {
    if (!detail?.explainability?.contributions) return [];
    return Object.entries(detail.explainability.contributions).map(([key, val]) => ({
      feature: key.replace('_0h', '').replace('_24h', '').replace('_', ' '),
      value: val.feature_value,
      shap: val.shap_contribution
    })).sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap)).slice(0, 6);
  };

  const chartData = getChartData();
  const shapData = getShapData();

  const gridColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#475569';
  const tooltipBg = resolvedTheme === 'dark' ? '#0e1525' : '#ffffff';
  const tooltipBorder = resolvedTheme === 'dark' ? '#1e293b' : '#cbd5e1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col transition-colors">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-[#080c14]/95 backdrop-blur-md z-10">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 font-mono font-bold">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold font-mono text-slate-900 dark:text-white">{componentId}</h2>
                {detail && <RiskBadge status={detail.status} isAnomaly={detail.is_anomaly} score={detail.risk_score} />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Manufacturing Lot: <span className="font-semibold text-slate-800 dark:text-slate-200">{detail?.lot_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {loading && (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                Querying semiconductor telemetry database & running TreeExplainer attributions...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-mono">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Component Health Gauge & Microchip Spec Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <HealthGauge score={detail.risk_score} status={detail.status} />
                </div>

                <div className="md:col-span-2 eng-card p-5 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-white flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-cyan-500" />
                      <span>Semiconductor Telemetry Specifications</span>
                    </h3>
                    <SignalTimeline
                      val0h={detail.measurement_history.find(m => m.time_point === '0h')?.value}
                      val24h={detail.measurement_history.find(m => m.time_point === '24h')?.value}
                      val96h={detail.measurement_history.find(m => m.time_point === '96h')?.value}
                      val168h={detail.actual_value_168h}
                      status={detail.status}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] block">Baseline 0h</span>
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {detail.measurement_history.find(m => m.time_point === '0h')?.value ?? '--'} µA
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] block">24h Telemetry</span>
                      <span className="font-bold text-amber-500 text-base">
                        {detail.measurement_history.find(m => m.time_point === '24h')?.value ?? '--'} µA
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] block">Pred. 168h</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 text-base">
                        {detail.predicted_value_168h} µA
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] block">Test Temp</span>
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {detail.temperature}°C
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-1">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">Anomaly Score:</span>{' '}
                      <span className={`font-bold ${detail.anomaly_score > 0.55 ? 'text-pink-500' : 'text-emerald-500'}`}>
                        {detail.anomaly_score}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">24h Drift Rate:</span>{' '}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{detail.drift_rate_24h} µA/h</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[10px]">Lot Deviation:</span>{' '}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{detail.z_score_0h} σ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Degradation Curve Line Chart */}
              <div className="eng-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-cyan-500" />
                    <h3 className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                      Burn-In Parameter Degradation Curve (0h - 168h)
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
                      <span className="text-slate-600 dark:text-slate-300">Actual Telemetry</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600 dark:text-slate-300">AI 168h Forecast</span>
                    </div>
                  </div>
                </div>

                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="time" stroke={axisColor} fontSize={12} tickLine={false} />
                      <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: resolvedTheme === 'dark' ? '#fff' : '#000' }}
                      />
                      <Line type="monotone" dataKey="actual" name="Actual (µA)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5, fill: '#06b6d4' }} connectNulls={true} />
                      <Line type="monotone" dataKey="forecast" name="AI Forecast (µA)" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 6, fill: '#ef4444' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Human-Readable XAI Reasons */}
              <div className="eng-card p-5 space-y-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                    Hybrid Risk Engine Diagnosis & XAI Explanations
                  </h3>
                </div>
                <div className="space-y-2">
                  {detail.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHAP Feature Attributions */}
              {shapData.length > 0 && (
                <div className="eng-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                        SHAP Feature Contributions for 168h Prediction
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">TreeExplainer Normalized Attribution</span>
                  </div>

                  <div className="h-44 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                        <XAxis type="number" stroke={axisColor} fontSize={11} />
                        <YAxis dataKey="feature" type="category" stroke={axisColor} fontSize={11} tickLine={false} width={110} />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: resolvedTheme === 'dark' ? '#fff' : '#000' }} />
                        <Bar dataKey="shap" name="SHAP Contribution" radius={[0, 4, 4, 0]}>
                          {shapData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.shap >= 0 ? '#6366f1' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
