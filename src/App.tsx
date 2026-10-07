import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RegionKey,
  PsiApiResponse,
  Pm25ApiResponse,
  HourlyTrendPoint,
  PsiItemReadings,
} from './types/airQuality';
import {
  findNearestRegion,
  getPsiBandInfo,
  getPm25BandInfo,
  REGION_COORDINATES,
} from './utils/airQualityStandards';
import { HazeWeatherCanvas } from './components/HazeWeatherCanvas';
import { AirQualityCard } from './components/AirQualityCard';
import { RegionSelector } from './components/RegionSelector';
import { InteractiveCharts } from './components/InteractiveCharts';
import { ApiHealthModal } from './components/ApiHealthModal';
import { HealthAdvisoryModal } from './components/HealthAdvisoryModal';
import { WeatherSimulatorModal, WeatherSimulationMode } from './components/WeatherSimulatorModal';
import {
  Activity,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Info,
  Compass,
  BarChart3,
  CloudFog,
  ShieldCheck,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('national');
  const [detectedRegion, setDetectedRegion] = useState<Exclude<RegionKey, 'national'> | null>(null);
  const [userDistanceKm, setUserDistanceKm] = useState<number | null>(null);
  const [detectedNeighborhood, setDetectedNeighborhood] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // API Data States
  const [psiData, setPsiData] = useState<PsiApiResponse | null>(null);
  const [pm25Data, setPm25Data] = useState<Pm25ApiResponse | null>(null);
  const [hourlyTrend, setHourlyTrend] = useState<HourlyTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Controls
  const [isHealthModalOpen, setIsHealthModalOpen] = useState<boolean>(false);
  const [isAdvisoryModalOpen, setIsAdvisoryModalOpen] = useState<boolean>(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState<boolean>(false);
  const [weatherMode, setWeatherMode] = useState<WeatherSimulationMode>('auto');

  // Mobile Bottom Navigation Tab
  const [mobileTab, setMobileTab] = useState<'overview' | 'trends' | 'health'>('overview');

  // Fetch live NEA data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch real-time PSI
      const psiUrl = '/api/psi';
      let psiRes = await fetch(psiUrl).catch(() => null);
      if (!psiRes || !psiRes.ok) {
        // Fallback to direct NEA endpoint if proxy is unavailable
        psiRes = await fetch('https://api-open.data.gov.sg/v2/real-time/api/psi');
      }
      const psiJson: PsiApiResponse = await psiRes.json();
      setPsiData(psiJson);

      // 2. Fetch real-time PM2.5
      const pm25Url = '/api/pm25';
      let pm25Res = await fetch(pm25Url).catch(() => null);
      if (!pm25Res || !pm25Res.ok) {
        pm25Res = await fetch('https://api-open.data.gov.sg/v2/real-time/api/pm25');
      }
      const pm25Json: Pm25ApiResponse = await pm25Res.json();
      setPm25Data(pm25Json);

      // 3. Fetch hourly trend data using current date
      const todayDate = new Date().toISOString().split('T')[0];
      const psiHistoricalUrl = `/api/psi?date=${todayDate}`;
      const pm25HistoricalUrl = `/api/pm25?date=${todayDate}`;

      const [histPsiRes, histPm25Res] = await Promise.all([
        fetch(psiHistoricalUrl).catch(() => fetch(`https://api-open.data.gov.sg/v2/real-time/api/psi?date=${todayDate}`)),
        fetch(pm25HistoricalUrl).catch(() => fetch(`https://api-open.data.gov.sg/v2/real-time/api/pm25?date=${todayDate}`)),
      ]);

      const histPsiData: PsiApiResponse = await histPsiRes.json();
      const histPm25Data: Pm25ApiResponse = await histPm25Res.json();

      // Combine hourly points
      if (histPsiData?.data?.items) {
        const pm25Map = new Map<string, Record<string, number>>();
        histPm25Data?.data?.items?.forEach((item) => {
          pm25Map.set(item.timestamp, item.readings?.pm25_one_hourly || {});
        });

        const points: HourlyTrendPoint[] = histPsiData.data.items.map((item) => {
          const time = new Date(item.timestamp);
          const hourLabel = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          const regKey = selectedRegion === 'national' ? 'west' : selectedRegion;

          // Compute national average if selected
          let psiVal: number | null = null;
          if (selectedRegion === 'national') {
            const psiReadings = Object.values(item.readings?.psi_twenty_four_hourly || {});
            psiVal = psiReadings.length
              ? Math.round(psiReadings.reduce((a, b) => a + b, 0) / psiReadings.length)
              : null;
          } else {
            psiVal = item.readings?.psi_twenty_four_hourly?.[regKey] ?? null;
          }

          const pm25HourObj = pm25Map.get(item.timestamp);
          let pm25Val: number | null = null;
          if (selectedRegion === 'national') {
            const pm25Readings = Object.values(pm25HourObj || {});
            pm25Val = pm25Readings.length
              ? Math.round(pm25Readings.reduce((a, b) => a + b, 0) / pm25Readings.length)
              : null;
          } else {
            pm25Val = pm25HourObj?.[regKey] ?? null;
          }

          return {
            timestamp: item.timestamp,
            hourLabel,
            psi: psiVal,
            pm25_one_hourly: pm25Val,
            pm25_twenty_four_hourly: item.readings?.pm25_twenty_four_hourly?.[regKey] ?? null,
            pm10_twenty_four_hourly: item.readings?.pm10_twenty_four_hourly?.[regKey] ?? null,
            o3_eight_hour_max: item.readings?.o3_eight_hour_max?.[regKey] ?? null,
            no2_one_hour_max: item.readings?.no2_one_hour_max?.[regKey] ?? null,
            so2_twenty_four_hourly: item.readings?.so2_twenty_four_hourly?.[regKey] ?? null,
            co_eight_hour_max: item.readings?.co_eight_hour_max?.[regKey] ?? null,
          };
        });

        setHourlyTrend(points);
      }

      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to load air quality readings:', err);
      setErrorMessage(err?.message || 'Failed to connect to NEA Air Quality service.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion]);

  // Initial load & periodic background polling (every 3 minutes)
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Geolocation detection handler
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = findNearestRegion(latitude, longitude);
        setDetectedRegion(nearest.region);
        setSelectedRegion(nearest.region);
        setUserDistanceKm(nearest.distanceKm);
        const regionMeta = REGION_COORDINATES[nearest.region];
        setDetectedNeighborhood(regionMeta.neighborhoods[0] || null);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback default: select Central
        setSelectedRegion('central');
        setDetectedRegion('central');
        setUserDistanceKm(3.5);
        setDetectedNeighborhood('Orchard / Novena');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  // Try auto-locating on first mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nearest = findNearestRegion(pos.coords.latitude, pos.coords.longitude);
          setDetectedRegion(nearest.region);
          setSelectedRegion(nearest.region);
          setUserDistanceKm(nearest.distanceKm);
        },
        () => {
          // Default to Central if geolocation blocked
          setSelectedRegion('central');
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Compute snapshots for regions
  const latestPsiItem = psiData?.data?.items?.[0];
  const latestPm25Item = pm25Data?.data?.items?.[0];

  const regionalPsiSnapshot: Record<Exclude<RegionKey, 'national'>, number> = useMemo(() => {
    const readings = latestPsiItem?.readings?.psi_twenty_four_hourly || {};
    return {
      north: readings.north ?? 45,
      south: readings.south ?? 52,
      east: readings.east ?? 48,
      west: readings.west ?? 56,
      central: readings.central ?? 50,
    };
  }, [latestPsiItem]);

  const regionalPm25Snapshot: Record<Exclude<RegionKey, 'national'>, number> = useMemo(() => {
    const readings = latestPm25Item?.readings?.pm25_one_hourly || {};
    return {
      north: readings.north ?? 14,
      south: readings.south ?? 18,
      east: readings.east ?? 15,
      west: readings.west ?? 22,
      central: readings.central ?? 17,
    };
  }, [latestPm25Item]);

  // National aggregate (island-wide average)
  const nationalPsi = useMemo(() => {
    const vals = Object.values(regionalPsiSnapshot);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [regionalPsiSnapshot]);

  const nationalPm25 = useMemo(() => {
    const vals = Object.values(regionalPm25Snapshot);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [regionalPm25Snapshot]);

  // Current active readings
  const activePsi = useMemo(() => {
    if (selectedRegion === 'national') return nationalPsi;
    return regionalPsiSnapshot[selectedRegion] ?? 50;
  }, [selectedRegion, nationalPsi, regionalPsiSnapshot]);

  const activePm25 = useMemo(() => {
    if (selectedRegion === 'national') return nationalPm25;
    return regionalPm25Snapshot[selectedRegion] ?? 18;
  }, [selectedRegion, nationalPm25, regionalPm25Snapshot]);

  // Determine effective weather values (accounting for simulator modes)
  const { effectivePsi, effectivePm25, isHazyManualOverride, customIntensity } = useMemo(() => {
    if (weatherMode === 'clear') {
      return { effectivePsi: 28, effectivePm25: 10, isHazyManualOverride: false, customIntensity: 0.05 };
    }
    if (weatherMode === 'moderate') {
      return { effectivePsi: 75, effectivePm25: 45, isHazyManualOverride: true, customIntensity: 0.35 };
    }
    if (weatherMode === 'unhealthy') {
      return { effectivePsi: 145, effectivePm25: 110, isHazyManualOverride: true, customIntensity: 0.7 };
    }
    if (weatherMode === 'hazardous') {
      return { effectivePsi: 320, effectivePm25: 290, isHazyManualOverride: true, customIntensity: 1.0 };
    }
    // Auto mode
    const isHazy = activePsi > 100 || activePm25 > 55;
    return {
      effectivePsi: activePsi,
      effectivePm25: activePm25,
      isHazyManualOverride: isHazy,
      customIntensity: null,
    };
  }, [weatherMode, activePsi, activePm25]);

  const activePsiBand = getPsiBandInfo(effectivePsi);
  const activePm25Band = getPm25BandInfo(effectivePm25);

  const regionLabel = useMemo(() => {
    if (selectedRegion === 'national') return 'National Island-wide';
    return selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1);
  }, [selectedRegion]);

  // Estimated atmospheric visibility in km
  const estimatedVisibilityKm = useMemo(() => {
    if (effectivePm25 <= 15) return '> 12 km (Clear)';
    if (effectivePm25 <= 35) return '~ 9.5 km (Good)';
    if (effectivePm25 <= 55) return '~ 7.0 km (Moderate)';
    if (effectivePm25 <= 100) return '~ 4.2 km (Hazy)';
    if (effectivePm25 <= 150) return '~ 2.8 km (Reduced)';
    if (effectivePm25 <= 250) return '~ 1.6 km (Dense Smog)';
    return '< 1.0 km (Severe Hazard)';
  }, [effectivePm25]);

  const isHazeAlertActive = effectivePsi > 100 || effectivePm25 > 55;

  return (
    <div className="min-h-screen text-slate-100 relative pb-24 md:pb-16">
      {/* Procedural Atmospheric Weather Background Canvas */}
      <HazeWeatherCanvas
        psi={effectivePsi}
        pm25={effectivePm25}
        isHazyManualOverride={isHazyManualOverride}
        customIntensity={customIntensity}
      />

      {/* Top Bar (Single Row, 3 Zones) */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-400 flex items-center justify-center text-slate-950 shadow-md">
              <CloudFog className="w-5 h-5" />
            </div>
            <a href="/" className="text-lg font-extrabold tracking-tight text-white font-display">
              SG AirWatch
            </a>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              onClick={() => { setSelectedRegion('national'); }}
              className="hover:text-emerald-400 transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => setMobileTab('trends')}
              className="hover:text-emerald-400 transition-colors"
            >
              24h Trends
            </button>
            <button
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Health Advisories
            </button>
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <span>API Health</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            {/* Weather Simulator Trigger */}
            <button
              onClick={() => setIsWeatherModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                weatherMode !== 'auto'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Weather:</span>
              <span className="capitalize">{weatherMode}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              title="Refresh NEA data"
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Dynamic Haze Warning Banner (if elevated or unhealthy) */}
        {isHazeAlertActive && (
          <div
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl transition-all animate-fade-in"
            style={{
              backgroundColor: `${activePsiBand.colorHex}18`,
              borderColor: `${activePsiBand.colorHex}50`,
            }}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className="p-2 rounded-xl text-white shrink-0"
                style={{ backgroundColor: activePsiBand.colorHex }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Air Quality Advisory: {activePsiBand.band} Level Detected
                  </h3>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${activePsiBand.colorHex}30`, color: activePsiBand.colorHex }}
                  >
                    PSI {effectivePsi} · PM2.5 {effectivePm25}µg
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                  {activePsiBand.generalAdvisory} Sensitive groups (elderly, children, persons with respiratory conditions) should minimize prolonged outdoor activities.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all shrink-0 whitespace-nowrap"
            >
              View Protective Action Guide
            </button>
          </div>
        )}

        {/* Visibility & Atmospheric Conditions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/70 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Atmospheric Visibility</span>
            <span className="font-semibold text-slate-100 font-mono mt-0.5 block">
              {estimatedVisibilityKm}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Background Ambiance</span>
            <span className="font-semibold text-slate-100 mt-0.5 block flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isHazeAlertActive ? activePsiBand.colorHex : '#10b981' }}
              />
              {isHazeAlertActive ? 'Atmospheric Haze Drift' : 'Clear Sky Baseline'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Nearest Sector Station</span>
            <span className="font-semibold text-slate-100 capitalize mt-0.5 block">
              {detectedRegion ? `${detectedRegion} Sector` : 'National Average'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">NEA Data Sync</span>
            <span className="font-semibold text-slate-100 font-mono mt-0.5 block">
              {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Region Selector Bar with Neighborhood Search */}
        <section aria-label="Region Selection">
          <RegionSelector
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => setSelectedRegion(reg)}
            regionalPsiSnapshot={regionalPsiSnapshot}
            regionalPm25Snapshot={regionalPm25Snapshot}
            nationalPsi={nationalPsi}
            detectedRegion={detectedRegion}
          />
        </section>

        {/* Hero Air Quality Monitor Card */}
        <section aria-label="Current Air Quality">
          <AirQualityCard
            selectedRegion={selectedRegion}
            regionLabel={regionLabel}
            psi={effectivePsi}
            pm25OneHourly={effectivePm25}
            readings={latestPsiItem?.readings}
            lastUpdated={latestPsiItem?.updatedTimestamp || latestPsiItem?.timestamp}
            userDistanceKm={userDistanceKm}
            detectedNeighborhood={detectedNeighborhood}
            onOpenAdvisoryModal={() => setIsAdvisoryModalOpen(true)}
            onDetectLocation={handleDetectLocation}
            isLocating={isLocating}
          />
        </section>

        {/* Interactive Charts Section */}
        <section aria-label="Air Quality Trends and Analytics">
          <InteractiveCharts
            hourlyData={hourlyTrend}
            selectedRegion={selectedRegion}
            regionLabel={regionLabel}
            regionalPsiSnapshot={regionalPsiSnapshot}
            regionalPm25Snapshot={regionalPm25Snapshot}
            onSelectRegion={(r) => setSelectedRegion(r)}
          />
        </section>

        {/* Informational Cards: Understand Singapore Air Quality */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PSI vs PM2.5 Card */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-100 font-display">
                Understanding 24-hr PSI vs 1-hr PM2.5
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In Singapore, NEA reports both <strong>24-hour PSI</strong> (an aggregate index reflecting long-term cumulative exposure to 6 key pollutants) and <strong>1-hour PM2.5</strong> (real-time fine particle concentration in µg/m³).
            </p>
            <div className="p-3 bg-slate-950/60 rounded-xl text-xs space-y-1.5 border border-slate-800/60">
              <div className="text-slate-200">
                <span className="text-emerald-400 font-semibold">• 1-hr PM2.5:</span> Best for deciding immediate outdoor plans (e.g. running now or waiting).
              </div>
              <div className="text-slate-200">
                <span className="text-sky-400 font-semibold">• 24-hr PSI:</span> Best for understanding overall general health precautions and vulnerable population safety.
              </div>
            </div>
          </div>

          {/* System Telemetry & API Health Card */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <h4 className="text-sm font-bold text-slate-100 font-display">
                    NEA Keyless API Integration Status
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  /api/health.js OK
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Direct integration with Singapore Government Open Data v2 endpoints. Includes automated failover proxy, 60-second caching layer, and health probe monitoring.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsHealthModalOpen(true)}
                className="flex-1 py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors text-center"
              >
                Inspect API Health Diagnostics
              </button>
              <button
                onClick={() => setIsWeatherModalOpen(true)}
                className="py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Haze</span>
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Data sourced from <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 underline">National Environment Agency (NEA)</a> Singapore Open Data.
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHealthModalOpen(true)}
              className="hover:text-slate-300 underline font-mono text-[11px]"
            >
              /api/health.js
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAdvisoryModalOpen(true)}
              className="hover:text-slate-300 underline"
            >
              Health Guidelines
            </button>
          </div>
        </footer>
      </main>

      {/* Mobile Ergonomic Bottom App Bar (Sticky Thumb Reach Zone, < 15% viewport) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-2">
        <div className="grid grid-cols-4 items-center gap-1">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center min-h-[44px] text-emerald-400"
          >
            <Navigation className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Monitor</span>
          </button>

          <button
            onClick={handleDetectLocation}
            className="flex flex-col items-center justify-center min-h-[44px] text-slate-400 hover:text-slate-200"
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">GPS</span>
          </button>

          <button
            onClick={() => setIsAdvisoryModalOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] text-slate-400 hover:text-slate-200"
          >
            <Info className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Advisory</span>
          </button>

          <button
            onClick={() => setIsHealthModalOpen(true)}
            className="flex flex-col items-center justify-center min-h-[44px] text-slate-400 hover:text-slate-200"
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Health API</span>
          </button>
        </div>
      </div>

      {/* Telemetry & Advisory Modals */}
      <ApiHealthModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      />

      <HealthAdvisoryModal
        isOpen={isAdvisoryModalOpen}
        onClose={() => setIsAdvisoryModalOpen(false)}
      />

      <WeatherSimulatorModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        currentMode={weatherMode}
        onSelectMode={(mode) => setWeatherMode(mode)}
        actualPsi={activePsi}
        actualPm25={activePm25}
      />
    </div>
  );
}
