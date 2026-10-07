import React, { useState, useMemo } from 'react';
import { RegionKey, HourlyTrendPoint } from '../types/airQuality';
import { getPsiBandInfo, getPm25BandInfo } from '../utils/airQualityStandards';

interface InteractiveChartsProps {
  hourlyData: HourlyTrendPoint[];
  selectedRegion: RegionKey;
  regionLabel: string;
  regionalPsiSnapshot: Record<Exclude<RegionKey, 'national'>, number>;
  regionalPm25Snapshot: Record<Exclude<RegionKey, 'national'>, number>;
  onSelectRegion?: (r: RegionKey) => void;
}

type MetricType = 'psi' | 'pm25_one_hourly' | 'pm10_twenty_four_hourly' | 'o3_eight_hour_max' | 'no2_one_hour_max';

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  hourlyData,
  selectedRegion,
  regionLabel,
  regionalPsiSnapshot,
  regionalPm25Snapshot,
  onSelectRegion,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('psi');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartView, setChartView] = useState<'trend' | 'comparison'>('trend');

  const metricConfig = {
    psi: {
      name: '24-hr PSI',
      unit: '',
      description: 'Pollutant Standards Index (Singapore NEA)',
      thresholds: [
        { label: 'Good', value: 50, color: '#10b981' },
        { label: 'Moderate', value: 100, color: '#0ea5e9' },
        { label: 'Unhealthy', value: 200, color: '#f59e0b' },
      ],
    },
    pm25_one_hourly: {
      name: '1-hr PM2.5',
      unit: 'µg/m³',
      description: 'Real-time Fine Particulate Matter (<2.5µm)',
      thresholds: [
        { label: 'Band I (Normal)', value: 55, color: '#10b981' },
        { label: 'Band II (Elevated)', value: 150, color: '#f59e0b' },
        { label: 'Band III (High)', value: 250, color: '#f97316' },
      ],
    },
    pm10_twenty_four_hourly: {
      name: 'PM10 (24-hr)',
      unit: 'µg/m³',
      description: 'Coarse Inhalable Dust Particles (<10µm)',
      thresholds: [
        { label: 'Normal', value: 50, color: '#10b981' },
        { label: 'Elevated', value: 100, color: '#f59e0b' },
      ],
    },
    o3_eight_hour_max: {
      name: 'Ozone (O₃)',
      unit: 'µg/m³',
      description: 'Ground-level Photochemical Smog Indicator',
      thresholds: [
        { label: 'Safe', value: 100, color: '#10b981' },
        { label: 'Advisory', value: 160, color: '#f59e0b' },
      ],
    },
    no2_one_hour_max: {
      name: 'NO₂ Max',
      unit: 'µg/m³',
      description: 'Nitrogen Dioxide Combustion Byproduct',
      thresholds: [
        { label: 'Normal', value: 200, color: '#10b981' },
      ],
    },
  };

  const currentMetric = metricConfig[activeMetric];

  // Prepare data points sorted chronologically
  const chartPoints = useMemo(() => {
    // NEA data returns items newest first or oldest first. Sort chronologically by timestamp
    const sorted = [...hourlyData].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return sorted.map((item) => {
      let val: number | null = null;
      if (activeMetric === 'psi') val = item.psi;
      else if (activeMetric === 'pm25_one_hourly') val = item.pm25_one_hourly;
      else if (activeMetric === 'pm10_twenty_four_hourly') val = item.pm10_twenty_four_hourly ?? null;
      else if (activeMetric === 'o3_eight_hour_max') val = item.o3_eight_hour_max ?? null;
      else if (activeMetric === 'no2_one_hour_max') val = item.no2_one_hour_max ?? null;
      return {
        ...item,
        value: val,
      };
    });
  }, [hourlyData, activeMetric]);

  // SVG Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 45, left: 45 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Min / Max computation
  const values = chartPoints.map((p) => p.value).filter((v): v is number => v !== null && !isNaN(v));
  const defaultMax = activeMetric === 'psi' ? 160 : activeMetric === 'pm25_one_hourly' ? 120 : 100;
  const maxValue = Math.max(defaultMax, ...(values.length ? values : [50])) * 1.15;
  const minValue = 0;

  // Coordinates mapping
  const pointsWithCoords = useMemo(() => {
    if (chartPoints.length === 0) return [];
    return chartPoints.map((item, idx) => {
      const x = padding.left + (idx / Math.max(1, chartPoints.length - 1)) * graphWidth;
      const yVal = item.value ?? 0;
      const normalizedY = (yVal - minValue) / Math.max(1, maxValue - minValue);
      const y = padding.top + graphHeight - normalizedY * graphHeight;
      return { ...item, x, y };
    });
  }, [chartPoints, graphWidth, graphHeight, maxValue, minValue, padding.left, padding.top]);

  // Smooth SVG Path generator
  const linePath = useMemo(() => {
    if (pointsWithCoords.length === 0) return '';
    return pointsWithCoords.reduce((path, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
    }, '');
  }, [pointsWithCoords]);

  // Area Fill Path
  const areaPath = useMemo(() => {
    if (pointsWithCoords.length === 0) return '';
    const firstX = pointsWithCoords[0].x;
    const lastX = pointsWithCoords[pointsWithCoords.length - 1].x;
    const bottomY = padding.top + graphHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, pointsWithCoords, padding.top, graphHeight]);

  const activePoint = hoveredIndex !== null && pointsWithCoords[hoveredIndex]
    ? pointsWithCoords[hoveredIndex]
    : pointsWithCoords[pointsWithCoords.length - 1];

  // Helper for status color of point
  const getPointColor = (val: number | null) => {
    if (val === null) return '#94a3b8';
    if (activeMetric === 'psi') return getPsiBandInfo(val).colorHex;
    if (activeMetric === 'pm25_one_hourly') return getPm25BandInfo(val).colorHex;
    return val > 100 ? '#f59e0b' : '#10b981';
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 md:p-6 shadow-xl space-y-5">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 font-display">
              Air Quality Analytics & Trends
            </h3>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-emerald-400 font-medium">Real-time NEA</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly readings across {regionLabel} with official air quality thresholds
          </p>
        </div>

        {/* View Switcher: 24h Trend vs Regional Snapshot */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setChartView('trend')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap min-h-[36px] ${
              chartView === 'trend'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24h Trend Curve
          </button>
          <button
            onClick={() => setChartView('comparison')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap min-h-[36px] ${
              chartView === 'comparison'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Region Comparison
          </button>
        </div>
      </div>

      {chartView === 'trend' ? (
        <>
          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {(Object.keys(metricConfig) as MetricType[]).map((metricKey) => {
              const info = metricConfig[metricKey];
              const isSelected = activeMetric === metricKey;
              return (
                <button
                  key={metricKey}
                  onClick={() => setActiveMetric(metricKey)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-h-[40px] flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800/40 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{info.name}</span>
                  {info.unit && <span className="text-[10px] text-slate-500">{info.unit}</span>}
                </button>
              );
            })}
          </div>

          {/* Interactive Metric Summary Strip */}
          {activePoint && (
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getPointColor(activePoint.value) }}
                />
                <div>
                  <span className="text-slate-400">Timestamp: </span>
                  <span className="font-semibold text-slate-200 tabular-nums">
                    {activePoint.hourLabel || new Date(activePoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400">{currentMetric.name}: </span>
                  <span className="font-bold text-sm tabular-nums" style={{ color: getPointColor(activePoint.value) }}>
                    {activePoint.value !== null ? activePoint.value : 'N/A'}{' '}
                    <span className="text-[10px] font-normal text-slate-400">{currentMetric.unit}</span>
                  </span>
                </div>
                {activeMetric === 'psi' && activePoint.value !== null && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getPsiBandInfo(activePoint.value).badgeBg} ${getPsiBandInfo(activePoint.value).badgeBorder} ${getPsiBandInfo(activePoint.value).badgeText}`}>
                    {getPsiBandInfo(activePoint.value).band}
                  </span>
                )}
                {activeMetric === 'pm25_one_hourly' && activePoint.value !== null && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getPm25BandInfo(activePoint.value).badgeBg} ${getPm25BandInfo(activePoint.value).badgeText}`}>
                    {getPm25BandInfo(activePoint.value).band}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SVG Chart with hover/touch interactive scrubber */}
          <div className="relative w-full overflow-hidden select-none">
            {pointsWithCoords.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                Loading hourly trend data from NEA API...
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto overflow-visible touch-none"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getPointColor(activePoint?.value ?? null)} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={getPointColor(activePoint?.value ?? null)} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid & Threshold lines */}
                {currentMetric.thresholds.map((th) => {
                  if (th.value > maxValue) return null;
                  const normalizedY = (th.value - minValue) / (maxValue - minValue);
                  const y = padding.top + graphHeight - normalizedY * graphHeight;
                  return (
                    <g key={th.label}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + graphWidth}
                        y2={y}
                        stroke={th.color}
                        strokeDasharray="4,4"
                        strokeOpacity="0.3"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left + graphWidth}
                        y={y - 4}
                        fill={th.color}
                        fontSize="9"
                        textAnchor="end"
                        opacity="0.8"
                        className="font-mono font-medium"
                      >
                        {th.label} ({th.value})
                      </text>
                    </g>
                  );
                })}

                {/* Horizontal Baseline */}
                <line
                  x1={padding.left}
                  y1={padding.top + graphHeight}
                  x2={padding.left + graphWidth}
                  y2={padding.top + graphHeight}
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeWidth="1"
                />

                {/* Y-axis Labels */}
                {[0, Math.round(maxValue * 0.5), Math.round(maxValue)].map((val) => {
                  const normalizedY = (val - minValue) / (maxValue - minValue);
                  const y = padding.top + graphHeight - normalizedY * graphHeight;
                  return (
                    <text
                      key={val}
                      x={padding.left - 8}
                      y={y + 3}
                      fill="rgba(148, 163, 184, 0.6)"
                      fontSize="10"
                      textAnchor="end"
                      className="font-mono tabular-nums"
                    >
                      {val}
                    </text>
                  );
                })}

                {/* Shaded Area under Curve */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Line Path */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={getPointColor(activePoint?.value ?? null)}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points and Touch Area Columns */}
                {pointsWithCoords.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  const colWidth = graphWidth / Math.max(1, pointsWithCoords.length);
                  return (
                    <g key={pt.timestamp}>
                      {/* Invisible wide hitbox for thumb & mouse hovering */}
                      <rect
                        x={pt.x - colWidth / 2}
                        y={padding.top}
                        width={colWidth}
                        height={graphHeight + padding.bottom}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onTouchStart={() => setHoveredIndex(idx)}
                      />

                      {/* Dot for hovered or key points */}
                      {(isHovered || idx === pointsWithCoords.length - 1) && (
                        <>
                          {/* Vertical Scrubber Guide line */}
                          <line
                            x1={pt.x}
                            y1={padding.top}
                            x2={pt.x}
                            y2={padding.top + graphHeight}
                            stroke="rgba(255, 255, 255, 0.3)"
                            strokeWidth="1.5"
                            strokeDasharray="2,2"
                          />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="5.5"
                            fill={getPointColor(pt.value)}
                            stroke="#0f172a"
                            strokeWidth="2"
                          />
                        </>
                      )}

                      {/* X-axis Time Label (show every 2-3 points to avoid crowding on mobile) */}
                      {(idx % 3 === 0 || idx === pointsWithCoords.length - 1) && (
                        <text
                          x={pt.x}
                          y={padding.top + graphHeight + 18}
                          fill="rgba(148, 163, 184, 0.6)"
                          fontSize="10"
                          textAnchor="middle"
                          className="font-mono tabular-nums"
                        >
                          {pt.hourLabel}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </>
      ) : (
        /* Regional Snapshot Comparison View */
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Current live comparison of all 5 Singapore geographical sectors:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {(['north', 'south', 'east', 'west', 'central'] as Array<Exclude<RegionKey, 'national'>>).map((reg) => {
              const psi = regionalPsiSnapshot[reg] || 0;
              const pm25 = regionalPm25Snapshot[reg] || 0;
              const psiBand = getPsiBandInfo(psi);
              const pm25Band = getPm25BandInfo(pm25);
              const isCurrent = selectedRegion === reg;

              return (
                <button
                  key={reg}
                  onClick={() => onSelectRegion?.(reg)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-100 capitalize">
                      {reg}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-baseline text-xs mb-1">
                        <span className="text-slate-400 text-[11px]">24-hr PSI</span>
                        <span className="font-bold text-base tabular-nums" style={{ color: psiBand.colorHex }}>
                          {psi}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (psi / 200) * 100)}%`,
                            backgroundColor: psiBand.colorHex,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {psiBand.band}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-slate-400 text-[11px]">1-hr PM2.5</span>
                        <span className="font-semibold text-sm tabular-nums" style={{ color: pm25Band.colorHex }}>
                          {pm25} <span className="text-[10px] text-slate-500">µg/m³</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {pm25Band.bandNumber} ({pm25Band.band})
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
