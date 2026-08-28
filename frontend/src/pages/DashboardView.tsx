import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon, Activity, Cpu, ArrowUpRight, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { DashboardSummary } from '../types';
import { api } from '../services/api';
import { KPICard } from '../components/KPICard';
import { RiskBadge } from '../components/RiskBadge';
import { AnomalyScatterPlot } from '../components/AnomalyScatterPlot';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  onSelectComponent: (comp_id: string) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectComponent, setActiveTab }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
          Loading BurnGuard Executive Dashboard Telemetry...
        </p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center eng-card rounded-3xl border-rose-500/30 max-w-xl mx-auto my-12">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-mono">Backend Connection Error</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{error}</p>
        <button
          onClick={fetchSummary}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm font-mono transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const pieData = [
    { name: 'SAFE', value: summary.risk_distribution.SAFE, color: '#10b981' },
    { name: 'MONITOR', value: summary.risk_distribution.MONITOR, color: '#f59e0b' },
    { name: 'HIGH RISK', value: summary.risk_distribution.HIGH_RISK, color: '#ef4444' },
  ];

  const lotData = Object.entries(summary.components_by_lot).map(([lot, count]) => ({
    lot,
    count
  })).slice(0, 8);

  const gridColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const axisColor = resolvedTheme === 'dark' ? '#94a3b8' : '#475569';
  const tooltipBg = resolvedTheme === 'dark' ? '#0e1525' : '#ffffff';
  const tooltipBorder = resolvedTheme === 'dark' ? '#1e293b' : '#cbd5e1';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="eng-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle background PCB pattern */}
        <svg className="absolute right-0 top-0 h-full w-1/3 opacity-15 pointer-events-none text-cyan-500" viewBox="0 0 200 100" fill="none">
          <path d="M0 20H80L120 60H200" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M20 90H100L140 30H200" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="80" cy="20" r="4" fill="currentColor" />
          <circle cx="100" cy="90" r="4" fill="currentColor" />
        </svg>

        <div className="z-10">
          <div className="flex items-center space-x-2">
            <Cpu className="h-6 w-6 text-cyan-500" />
            <h1 className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              Executive Telemetry Overview
            </h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
            Real-time predictive anomaly detection and component reliability monitoring across manufacturing lots.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10">
          <button
            onClick={() => setActiveTab('components')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 text-xs font-mono font-bold transition-all shadow-sm"
          >
            <span>Explore All Telemetry</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Components"
          value={summary.total_components.toLocaleString()}
          subtitle="Screened in database"
          trend="100% Lot Coverage"
          icon={Cpu}
          colorTheme="cyan"
        />
        <KPICard
          title="Safe Components"
          value={summary.safe_components.toLocaleString()}
          subtitle={`${Math.round((summary.safe_components / (summary.total_components || 1)) * 100)}% of lot total`}
          trend="Passed Screening"
          icon={ShieldCheck}
          colorTheme="emerald"
        />
        <KPICard
          title="Monitor Priority"
          value={summary.monitor_components.toLocaleString()}
          subtitle="Mild parameter drift"
          trend="Surveillance Req."
          icon={AlertTriangle}
          colorTheme="amber"
        />
        <KPICard
          title="High Risk Defective"
          value={summary.high_risk_components.toLocaleString()}
          subtitle="Immediate quarantine"
          trend="Early Rejection"
          icon={AlertOctagon}
          colorTheme="rose"
        />
        <KPICard
          title="Anomalies Flagged"
          value={summary.anomalies_detected.toLocaleString()}
          subtitle="Isolation Forest score"
          trend="Outlier Detection"
          icon={Activity}
          colorTheme="pink"
        />
        <KPICard
          title="Model Forecast MAE"
          value={`${summary.model_mae} µA`}
          subtitle="168h prediction error"
          trend="Ridge Regression"
          icon={BarChart2}
          colorTheme="indigo"
        />
      </div>

      {/* Anomaly Scatter Plot Matrix */}
      <AnomalyScatterPlot onSelectComponent={onSelectComponent} />

      {/* Charts Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Breakdown Pie Chart */}
        <div className="eng-card p-6 space-y-4">
          <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
            Manufacturing Lot Risk Category Breakdown
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={resolvedTheme === 'dark' ? '#070b12' : '#ffffff'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: resolvedTheme === 'dark' ? '#fff' : '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 pt-2 text-xs font-mono">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Components by Lot Bar Chart */}
        <div className="eng-card p-6 space-y-4">
          <h3 className="text-base font-bold font-mono text-slate-900 dark:text-white">
            Screened Components by Manufacturing Lot
          </h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lotData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="lot" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: resolvedTheme === 'dark' ? '#fff' : '#000' }} />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Units Screened" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent High Risk Alert Component Table */}
      <div className="eng-card overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              Recent High-Risk Component Alerts
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('components')}
            className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>View All High-Risk Units</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-slate-100 dark:bg-slate-900/80 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Component ID</th>
                <th className="px-6 py-3.5">Lot ID</th>
                <th className="px-6 py-3.5">0h Baseline</th>
                <th className="px-6 py-3.5">24h Telemetry</th>
                <th className="px-6 py-3.5">Pred. 168h</th>
                <th className="px-6 py-3.5">Risk Score</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {summary.recent_high_risk.map((comp) => (
                <tr key={comp.component_id} className="hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-cyan-500" />
                    <span>{comp.component_id}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{comp.lot_id}</td>
                  <td className="px-6 py-4">{comp.value_0h} µA</td>
                  <td className="px-6 py-4 text-amber-500 font-semibold">{comp.value_24h} µA</td>
                  <td className="px-6 py-4 text-rose-500 font-bold">{comp.predicted_value_168h} µA</td>
                  <td className="px-6 py-4 font-bold text-rose-500">{comp.risk_score} / 100</td>
                  <td className="px-6 py-4">
                    <RiskBadge status={comp.status} isAnomaly={comp.is_anomaly} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectComponent(comp.component_id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 text-xs font-semibold transition-all"
                    >
                      Inspect XAI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
