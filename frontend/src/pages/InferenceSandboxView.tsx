import React, { useState } from 'react';
import { Zap, Play, CheckCircle2, Cpu, Sparkles, AlertOctagon, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { PredictionResponse } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { MLPipelineDiagram } from '../components/MLPipelineDiagram';

export const InferenceSandboxView: React.FC = () => {
  const [compId, setCompId] = useState<string>('COMP_0428');
  const [lotId, setLotId] = useState<string>('LOT_H');
  const [val0h, setVal0h] = useState<number>(14.5);
  const [val24h, setVal24h] = useState<number>(48.2);
  const [temp, setTemp] = useState<number>(125);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const processingSequence = [
    'Initializing BurnGuard Model Engine',
    'Feature Extraction & Parameter Drift Computation',
    'Isolation Forest Baseline Anomaly Screening',
    'Ridge Regression 168h Parameter Degradation Forecast',
    'Hybrid Risk Scoring & Classification Assignment',
    'Computing Explainable AI (XAI) Diagnosis'
  ];

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    // Animated processing state steps
    for (let step = 0; step < processingSequence.length; step++) {
      setProcessingStep(step);
      await new Promise((res) => setTimeout(res, 220));
    }

    try {
      const data = await api.predictComponent({
        component_id: compId,
        lot_id: lotId,
        value_0h: Number(val0h),
        value_24h: Number(val24h),
        temperature: Number(temp)
      });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Prediction request failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (type: 'NORMAL' | 'DRIFT' | 'ANOMALY') => {
    if (type === 'NORMAL') {
      setCompId('COMP_0102');
      setLotId('LOT_A');
      setVal0h(10.5);
      setVal24h(11.2);
      setTemp(125);
    } else if (type === 'DRIFT') {
      setCompId('COMP_0428');
      setLotId('LOT_H');
      setVal0h(14.5);
      setVal24h(48.2);
      setTemp(125);
    } else {
      setCompId('COMP_0999');
      setLotId('LOT_X');
      setVal0h(32.8);
      setVal24h(39.4);
      setTemp(150);
    }
  };

  // Calculate drift percentage
  const driftPercent = val0h > 0 ? Math.round(((val24h - val0h) / val0h) * 100) : 0;

  const getRecommendation = (res: PredictionResponse) => {
    if (res.status === 'HIGH_RISK' || res.is_anomaly) {
      return {
        label: 'EARLY REJECTION',
        action: 'Quarantine immediately. Exceeds safe operational degradation slope.',
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/30'
      };
    }
    if (res.status === 'MONITOR') {
      return {
        label: 'EXTENDED SURVEILLANCE',
        action: 'Re-screen at 96h timepoint before releasing lot to packaging.',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/30'
      };
    }
    return {
      label: 'APPROVED FOR ASSEMBLY',
      action: 'Component meets parameter stability criteria.',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    };
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header Banner */}
      <div className="eng-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-cyan-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Real-Time Inference Sandbox & Testing Suite
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Input component telemetry parameters to execute instant Isolation Forest & degradation forecast inference.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 flex items-center space-x-1">
            <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
            <span>Telemetry Presets:</span>
          </span>
          <button
            onClick={() => loadPreset('NORMAL')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all font-semibold"
          >
            Normal Unit
          </button>
          <button
            onClick={() => loadPreset('DRIFT')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all font-semibold"
          >
            Rapid Drift
          </button>
          <button
            onClick={() => loadPreset('ANOMALY')}
            className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/30 hover:bg-pink-500/20 transition-all font-semibold"
          >
            Baseline Anomaly
          </button>
        </div>
      </div>

      {/* Interactive Machine Learning Pipeline Visualization */}
      <MLPipelineDiagram />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Technical Form */}
        <div className="eng-card p-6 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Cpu className="h-5 w-5 text-cyan-500" />
              <span>Component Telemetry Payload Input</span>
            </h3>

            <form onSubmit={handlePredict} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Component ID</label>
                  <input
                    type="text"
                    required
                    value={compId}
                    onChange={(e) => setCompId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Lot ID</label>
                  <input
                    type="text"
                    required
                    value={lotId}
                    onChange={(e) => setLotId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">0h Baseline (µA)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={val0h}
                    onChange={(e) => setVal0h(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">24h Value (µA)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={val24h}
                    onChange={(e) => setVal24h(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    required
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 uppercase tracking-wider"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Running AI Analysis...</span>
                  </div>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>RUN AI ANALYSIS</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Animated Processing State */}
          {loading && (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                <span>Model Pipeline Processing</span>
                <span>{Math.round(((processingStep + 1) / processingSequence.length) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${((processingStep + 1) / processingSequence.length) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                ● {processingSequence[processingStep]}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Live Output AI Screening Result Card */}
        <div className="eng-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI SCREENING RESULT
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">
                  Automated Component Failure Prevention Engine
                </p>
              </div>
              {result && <RiskBadge status={result.status} isAnomaly={result.is_anomaly} />}
            </div>

            {!result && !loading && (
              <div className="py-24 text-center text-slate-400 font-mono text-xs">
                Fill telemetry parameters and click <span className="text-cyan-500 font-bold">"RUN AI ANALYSIS"</span> to compute dynamic risk & 168h forecast.
              </div>
            )}

            {result && (
              <div className="space-y-5 mt-5">
                {/* Microchip Header summary */}
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Tested Component</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{result.component_id}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({result.lot_id})</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">24h Parameter Drift</span>
                    <span className={`text-base font-bold ${driftPercent > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      +{driftPercent}%
                    </span>
                  </div>
                </div>

                {/* Metric Summary Cards Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Anomaly Score</p>
                    <p className={`text-lg font-bold mt-1 ${result.anomaly_score > 0.55 ? 'text-pink-500' : 'text-emerald-500'}`}>
                      {result.anomaly_score}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Pred. 168h Value</p>
                    <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                      {result.predicted_value_168h} µA
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Hybrid Risk Score</p>
                    <p className={`text-lg font-bold mt-1 ${result.risk_score > 60 ? 'text-rose-500' : result.risk_score > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {result.risk_score} / 100
                    </p>
                  </div>
                </div>

                {/* Recommendation Banner */}
                {(() => {
                  const rec = getRecommendation(result);
                  return (
                    <div className={`p-4 rounded-2xl border ${rec.color} space-y-1`}>
                      <div className="flex items-center space-x-2 font-bold text-xs uppercase">
                        {result.status === 'HIGH_RISK' ? (
                          <AlertOctagon className="h-4 w-4" />
                        ) : result.status === 'MONITOR' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        <span>Recommendation: {rec.label}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                        {rec.action}
                      </p>
                    </div>
                  );
                })()}

                {/* Explainability Reasons */}
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase">AI Diagnosis Explanations:</p>
                  {result.reasons.map((r, i) => (
                    <div key={i} className="flex items-start space-x-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
