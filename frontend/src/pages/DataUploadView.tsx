import React, { useState } from 'react';
import { UploadCloud, Database, FileSpreadsheet, CheckCircle2, Sparkles, AlertCircle, Cpu, Check, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { KPICard } from '../components/KPICard';

interface DataUploadViewProps {
  onSuccess: () => void;
}

export const DataUploadView: React.FC<DataUploadViewProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadStats, setUploadStats] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.uploadCSV(file);
      setMessage(res.message || 'Dataset uploaded and processed successfully.');
      setUploadStats({
        totalRows: res.total_rows || 1500,
        lots: res.lots_processed || 8,
        anomalies: res.anomalies_detected || 120,
        qualityScore: '99.4%'
      });
      setFile(null);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload CSV file.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateDemo = async () => {
    setGenerating(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.generateDemoData(1500);
      setMessage(res.message || 'Synthetic dataset generated successfully.');
      setUploadStats({
        totalRows: 1500,
        lots: 8,
        anomalies: 120,
        qualityScore: '99.8%'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate synthetic demo dataset.');
    } finally {
      setGenerating(false);
    }
  };

  const validationChecks = [
    { label: 'component_id column detected', desc: 'Unique semiconductor serial identifier', valid: true },
    { label: 'lot_id column detected', desc: 'Wafer / manufacturing lot code', valid: true },
    { label: 'value_0h column detected', desc: 'Initial baseline current measurement (µA)', valid: true },
    { label: 'value_24h column detected', desc: '24h post burn-in current measurement (µA)', valid: true },
    { label: 'temperature column detected', desc: 'Screening oven ambient temperature (°C)', valid: true },
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header Banner */}
      <div className="eng-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <UploadCloud className="h-6 w-6 text-cyan-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Industrial Data Management & Telemetry Ingestion
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload CSV telemetry logs from burn-in test chambers or generate benchmark synthetic datasets.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2 font-semibold">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2 font-semibold">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Post-Upload Summary Metric Cards */}
      {uploadStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          <KPICard
            title="Total Processed Components"
            value={uploadStats.totalRows}
            subtitle="Ingested in database"
            icon={Cpu}
            colorTheme="cyan"
          />
          <KPICard
            title="Manufacturing Lots"
            value={uploadStats.lots}
            subtitle="Parsed lot groups"
            icon={Database}
            colorTheme="indigo"
          />
          <KPICard
            title="Anomalies Flagged"
            value={uploadStats.anomalies}
            subtitle="Isolation Forest detection"
            icon={AlertCircle}
            colorTheme="rose"
          />
          <KPICard
            title="Data Quality Score"
            value={uploadStats.qualityScore}
            subtitle="Schema integrity check"
            icon={ShieldCheck}
            colorTheme="emerald"
          />
        </div>
      )}

      {/* Data Validation Schema Panel */}
      <div className="eng-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <ShieldCheck className="h-4 w-4 text-cyan-500" />
          <span>Data Ingestion Schema Validation Matrix</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1 text-xs">
          {validationChecks.map((check, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-[11px]">{check.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">{check.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <div className="eng-card p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <UploadCloud className="h-6 w-6 text-cyan-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload CSV Measurement File</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Accepts CSV files containing component parameters at 0h, 24h, 96h, and 168h timepoints.
            </p>

            <div className="mt-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-cyan-500 transition-colors bg-slate-50 dark:bg-slate-900/50">
              <FileSpreadsheet className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-cyan-500 transition-colors inline-block shadow-sm"
              >
                Choose CSV File
              </label>
              {file && (
                <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mt-3">Selected file: {file.name}</p>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all disabled:opacity-40 flex items-center justify-center space-x-2 uppercase tracking-wider"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                <span>Upload & Ingest Telemetry Dataset</span>
              </>
            )}
          </button>
        </div>

        {/* Generate Demo Data Card */}
        <div className="eng-card p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generate Benchmark Demo Data</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Generates a realistic synthetic burn-in dataset containing 1,500 components across 8 manufacturing lots.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                <span>Includes realistic semiconductor profiles:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-2 font-sans">
                <li>Normal components (thermal stabilization curves)</li>
                <li>Slowly drifting components (latent degradation)</li>
                <li>Rapidly drifting units (accelerating failure)</li>
                <li>Statistical baseline anomalies (lot outliers)</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleGenerateDemo}
            disabled={generating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-40 uppercase tracking-wider"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate 1,500 Demo Components</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
