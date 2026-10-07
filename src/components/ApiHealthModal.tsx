import React, { useState, useEffect } from 'react';
import { ApiHealthReport } from '../types/airQuality';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, X, Server, Database, Clock } from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<ApiHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Direct call to /api/health.js
      const res = await fetch('/api/health.js');
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to reach /api/health.js');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (status === 'degraded') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <XCircle className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                API Health & Telemetry Monitor
              </h3>
              <p className="text-xs text-slate-400">
                Endpoint: <code className="text-emerald-300 font-mono">/api/health.js</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Refresh & Quick Status Banner */}
        <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-3">
            {report ? getStatusIcon(report.status) : <Clock className="w-4 h-4 text-slate-400" />}
            <div>
              <div className="text-sm font-bold text-white capitalize">
                System Status: {report?.status || 'Checking...'}
              </div>
              <div className="text-xs text-slate-400">
                {report
                  ? `Checked in ${report.totalDurationMs}ms · Uptime ${report.uptimeSeconds}s`
                  : 'Pinging endpoints...'}
              </div>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Ping Now</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Services Status Cards */}
        {report && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Upstream NEA Services
            </h4>

            {/* PSI Endpoint */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-semibold text-slate-200">
                    NEA PSI API Endpoint
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(report.services.psi.status)}
                  <span className="text-xs font-mono font-medium text-slate-300 capitalize">
                    {report.services.psi.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800/40 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">HTTP Status</span>
                  <span className="text-slate-200 font-semibold">{report.services.psi.httpStatus} OK</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Latency</span>
                  <span className="text-emerald-400 font-semibold">{report.services.psi.responseTimeMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Readings</span>
                  <span className="text-slate-200">{report.services.psi.readingsAvailable ? 'Available' : 'None'}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 truncate pt-1">
                URL: {report.services.psi.url}
              </div>
            </div>

            {/* PM2.5 Endpoint */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-200">
                    NEA 1-hr PM2.5 API Endpoint
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(report.services.pm25.status)}
                  <span className="text-xs font-mono font-medium text-slate-300 capitalize">
                    {report.services.pm25.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800/40 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">HTTP Status</span>
                  <span className="text-slate-200 font-semibold">{report.services.pm25.httpStatus} OK</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Latency</span>
                  <span className="text-emerald-400 font-semibold">{report.services.pm25.responseTimeMs} ms</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Readings</span>
                  <span className="text-slate-200">{report.services.pm25.readingsAvailable ? 'Available' : 'None'}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 truncate pt-1">
                URL: {report.services.pm25.url}
              </div>
            </div>

            {/* Host Runtime Environment */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 font-medium">Server Runtime:</span>
                <span className="font-mono text-slate-400">{report.system?.nodeVersion}</span>
              </div>
              {report.system?.memoryUsage && (
                <div className="font-mono text-slate-400 text-[11px]">
                  Heap: {report.system.memoryUsage.heapUsedMB} MB
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle Raw JSON */}
        <div className="pt-2">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-mono"
          >
            {showRawJson ? 'Hide Raw JSON Payload' : 'View Raw JSON Response'}
          </button>

          {showRawJson && report && (
            <pre className="mt-2 p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(report, null, 2)}
            </pre>
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
