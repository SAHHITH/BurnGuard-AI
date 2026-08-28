import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import type { PaginatedComponents } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { SignalTimeline } from '../components/SignalTimeline';

interface ComponentsViewProps {
  onSelectComponent: (comp_id: string) => void;
}

export const ComponentsView: React.FC<ComponentsViewProps> = ({ onSelectComponent }) => {
  const [data, setData] = useState<PaginatedComponents | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('ALL');
  const [lotId, setLotId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('risk_score');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  useEffect(() => {
    fetchComponents();
  }, [page, status, lotId, sortBy, sortDesc]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchComponents();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const res = await api.getComponents(page, 20, search, lotId, status, sortBy, sortDesc);
      setData(res);
    } catch (err) {
      console.error("Failed to load components:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Search & Filter Engineering Bar */}
      <div className="eng-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="h-6 w-6 text-cyan-500" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Component Telemetry Bench Grid
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time parameter drift monitoring, signal timelines, and AI screening predictions across test lots.
            </p>
          </div>

          {/* Status Classification Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            {['ALL', 'SAFE', 'MONITOR', 'HIGH_RISK'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatus(tab); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  status === tab
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input & Lot Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Component ID (e.g. C00105) or Lot ID (e.g. LOT_03)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter Lot ID..."
              value={lotId}
              onChange={(e) => { setLotId(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Telemetry Table */}
      <div className="eng-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900/80 uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('component_id')}>
                  <div className="flex items-center space-x-1">
                    <span>Component ID</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-6 py-4">Lot ID</th>
                <th className="px-6 py-4">Signal Degradation Timeline (0h → 168h)</th>
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('predicted_value_168h')}>
                  <div className="flex items-center space-x-1">
                    <span>Pred. 168h</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-cyan-500" onClick={() => handleSort('risk_score')}>
                  <div className="flex items-center space-x-1">
                    <span>Hybrid Risk Score</span>
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                </th>
                <th className="px-6 py-4">Status Classification</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-3"></div>
                    Querying Semiconductor Telemetry Database...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching components found. Adjust telemetry search filters.
                  </td>
                </tr>
              ) : (
                data?.items.map((comp) => (
                  <tr key={comp.component_id} className="hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Cpu className="h-4 w-4 text-cyan-500" />
                      <span>{comp.component_id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{comp.lot_id}</td>
                    <td className="px-6 py-4">
                      <SignalTimeline
                        val0h={comp.value_0h}
                        val24h={comp.value_24h}
                        val96h={null}
                        val168h={comp.actual_value_168h}
                        status={comp.status}
                      />
                    </td>
                    <td className="px-6 py-4 font-bold text-cyan-600 dark:text-cyan-400">{comp.predicted_value_168h} µA</td>
                    <td className="px-6 py-4 font-bold">
                      <span className={comp.risk_score > 60 ? 'text-rose-500' : comp.risk_score > 30 ? 'text-amber-500' : 'text-emerald-500'}>
                        {comp.risk_score} / 100
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge status={comp.status} isAnomaly={comp.is_anomaly} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectComponent(comp.component_id)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 font-semibold transition-all"
                      >
                        Inspect Telemetry
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{((page - 1) * 20) + 1}</span> to <span className="font-semibold text-slate-900 dark:text-white">{Math.min(page * 20, data.total)}</span> of <span className="font-semibold text-slate-900 dark:text-white">{data.total}</span> components
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-800 dark:text-slate-200">Page {page} of {data.total_pages}</span>
              <button
                disabled={page >= data.total_pages}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
