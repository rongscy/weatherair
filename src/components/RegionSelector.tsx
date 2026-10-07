import React, { useState } from 'react';
import { RegionKey } from '../types/airQuality';
import { getPsiBandInfo, REGION_COORDINATES, searchRegionByNeighborhood } from '../utils/airQualityStandards';
import { Search, MapPin } from 'lucide-react';

interface RegionSelectorProps {
  selectedRegion: RegionKey;
  onSelectRegion: (r: RegionKey) => void;
  regionalPsiSnapshot: Record<Exclude<RegionKey, 'national'>, number>;
  regionalPm25Snapshot: Record<Exclude<RegionKey, 'national'>, number>;
  nationalPsi: number;
  detectedRegion?: Exclude<RegionKey, 'national'> | null;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedRegion,
  onSelectRegion,
  regionalPsiSnapshot,
  regionalPm25Snapshot,
  nationalPsi,
  detectedRegion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matchedRegion = searchRegionByNeighborhood(searchQuery);
    if (matchedRegion) {
      onSelectRegion(matchedRegion);
      setSearchFeedback(`Found "${searchQuery}" in ${matchedRegion.toUpperCase()} region`);
      setTimeout(() => setSearchFeedback(null), 3500);
    } else {
      setSearchFeedback(`No direct station match for "${searchQuery}". Showing nearest regions.`);
      setTimeout(() => setSearchFeedback(null), 3500);
    }
  };

  const regions: Array<{ key: RegionKey; label: string; sub: string }> = [
    { key: 'national', label: 'National', sub: 'Island-wide' },
    { key: 'north', label: 'North', sub: 'Woodlands / Yishun' },
    { key: 'south', label: 'South', sub: 'Marina Bay / CBD' },
    { key: 'east', label: 'East', sub: 'Tampines / Changi' },
    { key: 'west', label: 'West', sub: 'Jurong / Clementi' },
    { key: 'central', label: 'Central', sub: 'Bishan / Orchard' },
  ];

  return (
    <div className="space-y-3">
      {/* Search Input Bar for Neighborhood Lookup */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search neighborhood (e.g. Tampines, Jurong, Woodlands, Orchard, Bedok...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder:text-slate-500 pl-10 pr-24 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors whitespace-nowrap"
          >
            Find
          </button>
        </form>

        {searchFeedback && (
          <div className="text-xs text-emerald-400 flex items-center gap-1.5 px-3 py-2 bg-emerald-950/40 rounded-xl border border-emerald-800/40 animate-fade-in">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{searchFeedback}</span>
          </div>
        )}
      </div>

      {/* Region Tabs / Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {regions.map((reg) => {
          const isSelected = selectedRegion === reg.key;
          const isDetected = detectedRegion === reg.key;
          const psi = reg.key === 'national' ? nationalPsi : regionalPsiSnapshot[reg.key] || 0;
          const pm25 = reg.key === 'national' ? null : regionalPm25Snapshot[reg.key];
          const psiBand = getPsiBandInfo(psi);

          return (
            <button
              key={reg.key}
              onClick={() => onSelectRegion(reg.key)}
              className={`text-left p-3 rounded-xl border transition-all relative min-h-[58px] ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700/60'
              }`}
            >
              {isDetected && (
                <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {reg.label}
                </span>
                <span
                  className="text-xs font-extrabold tabular-nums"
                  style={{ color: psiBand.colorHex }}
                >
                  {psi}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span className="truncate max-w-[80px]">{reg.sub.split('/')[0]}</span>
                {pm25 !== null && pm25 !== undefined ? (
                  <span className="tabular-nums font-mono text-slate-300">
                    {pm25} µg
                  </span>
                ) : (
                  <span className="text-slate-500">Avg</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
