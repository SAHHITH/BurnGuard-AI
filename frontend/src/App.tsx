import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { ComponentDetailModal } from './components/ComponentDetailModal';
import { DashboardView } from './pages/DashboardView';
import { ComponentsView } from './pages/ComponentsView';
import { InferenceSandboxView } from './pages/InferenceSandboxView';
import { DataUploadView } from './pages/DataUploadView';
import { ModelAnalyticsView } from './pages/ModelAnalyticsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const handleSelectComponent = (comp_id: string) => {
    setSelectedComponentId(comp_id);
  };

  const handleCloseModal = () => {
    setSelectedComponentId(null);
  };

  const handleUploadSuccess = () => {
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen pcb-background flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-400">
      {/* Top Header Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView onSelectComponent={handleSelectComponent} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'components' && (
          <ComponentsView onSelectComponent={handleSelectComponent} />
        )}
        {activeTab === 'sandbox' && (
          <InferenceSandboxView />
        )}
        {activeTab === 'upload' && (
          <DataUploadView onSuccess={handleUploadSuccess} />
        )}
        {activeTab === 'analytics' && (
          <ModelAnalyticsView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 bg-white/80 dark:bg-[#070b12]/80 text-xs font-mono text-slate-500 dark:text-slate-400 text-center backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">BurnGuard AI Platform v1.0</span>
            <span>—</span>
            <span>Predictive Electronic Component Burn-In Anomaly Screening</span>
          </div>
          <div>
            Built with FastAPI, Scikit-Learn, React, Recharts & Tailwind CSS
          </div>
        </div>
      </footer>

      {/* Inspection Modal Drawer */}
      <ComponentDetailModal
        componentId={selectedComponentId}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
