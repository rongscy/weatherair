import React from 'react';
import { RegionKey, PsiItemReadings } from '../types/airQuality';
import { getPsiBandInfo, getPm25BandInfo, REGION_COORDINATES } from '../utils/airQualityStandards';
import { AlertTriangle, ShieldCheck, Wind, Activity, Info, MapPin } from 'lucide-react';

interface AirQualityCardProps {
  selectedRegion: RegionKey;
  regionLabel: string;
  psi: number;
  pm25OneHourly: number;
  readings?: PsiItemReadings;
  lastUpdated?: string;
  userDistanceKm?: number | null;
  detectedNeighborhood?: string | null;
  onOpenAdvisoryModal: () => void;
  onDetectLocation: () => void;
  isLocating?: boolean;
}

export const AirQualityCard: React.FC<AirQualityCardProps> = ({
  selectedRegion,
  regionLabel,
  psi,
  pm25OneHourly,
  readings,
  lastUpdated,
  userDistanceKm,
  detectedNeighborhood,
  onOpenAdvisoryModal,
  onDetectLocation,
  isLocating,
}) => {
  const psiBand = getPsiBandInfo(psi);
  const pm25Band = getPm25BandInfo(pm25OneHourly);

  // Circular Gauge Calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  // Normalized to max PSI 300 scale
  const gaugePercent = Math.min(100, Math.max(5, (psi / 300) * 100));
  const strokeDashoffset = circumference - (gaugePercent / 100) * circumference;

  // Sub-pollutants for selected region
  const regionKeyStr = selectedRegion === 'national' ? 'west' : selectedRegion; // default fallback
  const pm10 = readings?.pm10_twenty_four_hourly?.[regionKeyStr] ?? null;
  const o3 = readings?.o3_eight_hour_max?.[regionKeyStr] ?? null;
  const no2 = readings?.no2_one_hour_max?.[regionKeyStr] ?? null;
  const so2 = readings?.so2_twenty_four_hourly?.[regionKeyStr] ?? null;
  const co = readings?.co_eight_hour_max?.[regionKeyStr] ?? null;

  return (
    <div className="relative overflow-hidden bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-5 md:p-8">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
        style={{ backgroundColor: psiBand.colorHex }}
      />

      {/* Top Bar: Location & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Live Air Quality Station
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              NEA Real-time
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              {regionLabel} Sector
            </h2>
            {selectedRegion !== 'national' && (
              <span className="text-xs text-slate-400 hidden sm:inline">
                ({REGION_COORDINATES[selectedRegion]?.neighborhoods.slice(0, 3).join(', ')}...)
              </span>
            )}
          </div>

          {/* User Location Proximity */}
          {userDistanceKm !== null && userDistanceKm !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {detectedNeighborhood ? `Near ${detectedNeighborhood} ` : 'Your Location: '}
                <span className="text-emerald-300 font-semibold">~{userDistanceKm} km</span> from station
              </span>
            </div>
          )}
        </div>

        {/* GPS Location Button */}
        <button
          onClick={onDetectLocation}
          disabled={isLocating}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-60"
        >
          <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-400' : 'text-slate-300'}`} />
          <span>{isLocating ? 'Locating...' : 'Detect Nearest Station'}</span>
        </button>
      </div>

      {/* Main Grid: PSI Gauge + 1-hr PM2.5 + Health Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: PSI Circular Radial Display (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center sm:flex-row sm:justify-center lg:flex-row gap-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          {/* Radial Gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#1e293b"
                strokeWidth="12"
                fill="none"
              />
              {/* Colored Indicator Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={psiBand.colorHex}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Value in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                24-hr PSI
              </span>
              <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight font-display">
                {psi}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                Max 300+
              </span>
            </div>
          </div>

          {/* PSI Band Description */}
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                 style={{
                   backgroundColor: `${psiBand.colorHex}20`,
                   borderColor: `${psiBand.colorHex}50`,
                   color: psiBand.colorHex,
                 }}>
              {psi > 100 ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{psiBand.band}</span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Standard: {psiBand.range}
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
              {psiBand.generalAdvisory}
            </p>
          </div>
        </div>

        {/* Middle Column: PM2.5 1-Hour Reading (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                1-hr PM2.5
              </span>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${pm25Band.colorHex}25`,
                  color: pm25Band.colorHex,
                }}
              >
                {pm25Band.bandNumber}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white tabular-nums tracking-tight font-display">
                {pm25OneHourly}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                µg/m³
              </span>
            </div>

            <div className="mt-2">
              <span className="text-xs font-semibold" style={{ color: pm25Band.colorHex }}>
                {pm25Band.band}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {pm25Band.description}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Threshold Range:</span>
            <span className="font-mono text-slate-300 font-medium">{pm25Band.range}</span>
          </div>
        </div>

        {/* Right Column: Dynamic Warning & Advisory Callout (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 h-full">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Health Guideline
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {psi > 100 || pm25OneHourly > 55
                ? 'Hazy conditions detected. Sensitive groups should minimize prolonged outdoor exercise.'
                : 'Clean ambient air. Safe for running, cycling, and outdoor recreation across all age groups.'}
            </p>
          </div>

          <button
            onClick={onOpenAdvisoryModal}
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all"
          >
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>NEA Health Advisory Table</span>
          </button>
        </div>
      </div>

      {/* Sub-Pollutants Matrix Strip */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Key NEA Sub-Pollutant Matrix
          </span>
          {lastUpdated && (
            <span className="text-[11px] text-slate-500 font-mono">
              Last synced: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
            <div className="text-[10px] text-slate-400 uppercase font-medium">PM10 (24-hr)</div>
            <div className="text-base font-bold text-slate-100 tabular-nums font-mono mt-0.5">
              {pm10 !== null ? `${pm10} µg/m³` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500">Inhalable Dust</div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Ozone O₃ (8-hr)</div>
            <div className="text-base font-bold text-slate-100 tabular-nums font-mono mt-0.5">
              {o3 !== null ? `${o3} µg/m³` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500">Photochemical</div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
            <div className="text-[10px] text-slate-400 uppercase font-medium">NO₂ (1-hr Max)</div>
            <div className="text-base font-bold text-slate-100 tabular-nums font-mono mt-0.5">
              {no2 !== null ? `${no2} µg/m³` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500">Combustion Gas</div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
            <div className="text-[10px] text-slate-400 uppercase font-medium">SO₂ (24-hr)</div>
            <div className="text-base font-bold text-slate-100 tabular-nums font-mono mt-0.5">
              {so2 !== null ? `${so2} µg/m³` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500">Sulfur Dioxide</div>
          </div>

          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 uppercase font-medium">CO (8-hr Max)</div>
            <div className="text-base font-bold text-slate-100 tabular-nums font-mono mt-0.5">
              {co !== null ? `${co} mg/m³` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500">Carbon Monoxide</div>
          </div>
        </div>
      </div>
    </div>
  );
};
