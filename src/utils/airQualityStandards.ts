import { PsiBandInfo, Pm25BandInfo, RegionKey } from '../types/airQuality';

/**
 * NEA Standard 24-hr PSI bands:
 * 0 - 50: Good
 * 51 - 100: Moderate
 * 101 - 200: Unhealthy
 * 201 - 300: Very Unhealthy
 * > 300: Hazardous
 */
export function getPsiBandInfo(psi: number): PsiBandInfo {
  if (psi <= 50) {
    return {
      band: 'Good',
      range: '0 – 50',
      colorHex: '#10b981', // emerald-500
      badgeBg: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-400',
      accentBg: 'bg-emerald-500',
      accentGlow: 'shadow-[0_0_24px_rgba(16,185,129,0.35)]',
      generalAdvisory: 'Air quality is satisfactory. Enjoy all outdoor sports and physical activities.',
      vulnerableAdvisory: 'Normal outdoor activities. No special precautions required.',
      healthyPersonAdvisory: 'Normal activities for everyone.',
      hazeIntensity: 0.05,
    };
  }

  if (psi <= 100) {
    return {
      band: 'Moderate',
      range: '51 – 100',
      colorHex: '#0ea5e9', // sky-500
      badgeBg: 'bg-sky-500/15',
      badgeBorder: 'border-sky-500/30',
      badgeText: 'text-sky-400',
      accentBg: 'bg-sky-500',
      accentGlow: 'shadow-[0_0_24px_rgba(14,165,233,0.35)]',
      generalAdvisory: 'Air quality is acceptable. Normal outdoor activities can continue for the general public.',
      vulnerableAdvisory: 'Persons unusually sensitive to air pollution should monitor how they feel.',
      healthyPersonAdvisory: 'Normal outdoor activities.',
      hazeIntensity: 0.25,
    };
  }

  if (psi <= 200) {
    return {
      band: 'Unhealthy',
      range: '101 – 200',
      colorHex: '#f59e0b', // amber-500
      badgeBg: 'bg-amber-500/15',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400',
      accentBg: 'bg-amber-500',
      accentGlow: 'shadow-[0_0_28px_rgba(245,158,11,0.4)]',
      generalAdvisory: 'Haze noticeable. Everyone should reduce prolonged or strenuous outdoor physical exertion.',
      vulnerableAdvisory: 'Elderly, pregnant women and children should minimize outdoor exertion. Heart/lung patients stay indoors.',
      healthyPersonAdvisory: 'Reduce prolonged or heavy outdoor workouts.',
      hazeIntensity: 0.65,
    };
  }

  if (psi <= 300) {
    return {
      band: 'Very Unhealthy',
      range: '201 – 300',
      colorHex: '#f97316', // orange-500
      badgeBg: 'bg-orange-500/15',
      badgeBorder: 'border-orange-500/30',
      badgeText: 'text-orange-400',
      accentBg: 'bg-orange-500',
      accentGlow: 'shadow-[0_0_32px_rgba(249,115,22,0.45)]',
      generalAdvisory: 'Significant haze hazard. The general public should avoid prolonged or heavy outdoor exertion.',
      vulnerableAdvisory: 'Elderly, children & heart/lung patients should avoid outdoor activity and remain indoors with air filtration.',
      healthyPersonAdvisory: 'Avoid strenuous outdoor activities. Wear N95 respirator if outdoor stay is necessary.',
      hazeIntensity: 0.85,
    };
  }

  return {
    band: 'Hazardous',
    range: '> 300',
    colorHex: '#ef4444', // red-500
    badgeBg: 'bg-red-500/15',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-400',
    accentBg: 'bg-red-500',
    accentGlow: 'shadow-[0_0_36px_rgba(239,68,68,0.5)]',
    generalAdvisory: 'Emergency health warning. Everyone should minimize outdoor exposure and keep doors and windows shut.',
    vulnerableAdvisory: 'Strictly avoid going outdoors. Seek medical attention promptly if breathing difficulties occur.',
    healthyPersonAdvisory: 'Stay indoors. Wear N95 mask if outdoors.',
    hazeIntensity: 1.0,
  };
}

/**
 * NEA Standard 1-hr PM2.5 bands:
 * Band I (Normal): 0 – 55 µg/m³
 * Band II (Elevated): 56 – 150 µg/m³
 * Band III (High): 151 – 250 µg/m³
 * Band IV (Very High): > 250 µg/m³
 */
export function getPm25BandInfo(pm25: number): Pm25BandInfo {
  if (pm25 <= 55) {
    return {
      band: 'Normal',
      bandNumber: 'Band I',
      range: '0 – 55 µg/m³',
      colorHex: '#10b981',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      description: 'Normal range. Safe for all immediate outdoor activities.',
      activityGuide: 'Normal activities for everyone.',
    };
  }

  if (pm25 <= 150) {
    return {
      band: 'Elevated',
      bandNumber: 'Band II',
      range: '56 – 150 µg/m³',
      colorHex: '#f59e0b',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      description: 'Elevated particulate matter. Hazy smell or visual haze may be noticeable.',
      activityGuide: 'Reduce prolonged strenuous outdoor activity if sensitive.',
    };
  }

  if (pm25 <= 250) {
    return {
      band: 'High',
      bandNumber: 'Band III',
      range: '151 – 250 µg/m³',
      colorHex: '#f97316',
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-400',
      description: 'High particulate concentration. Visibility degraded.',
      activityGuide: 'Avoid heavy outdoor physical workouts.',
    };
  }

  return {
    band: 'Very High',
    bandNumber: 'Band IV',
    range: '> 250 µg/m³',
    colorHex: '#ef4444',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    description: 'Very high particulate pollution. Severe haze conditions.',
    activityGuide: 'Stay indoors with air purifier operating.',
  };
}

/**
 * Official NEA Regional Monitoring Station Coordinates
 */
export const REGION_COORDINATES: Record<Exclude<RegionKey, 'national'>, { lat: number; lng: number; label: string; neighborhoods: string[] }> = {
  north: {
    lat: 1.41803,
    lng: 103.82,
    label: 'North',
    neighborhoods: ['Woodlands', 'Yishun', 'Sembawang', 'Admiralty', 'Khatib', 'Canberra', 'Marsiling'],
  },
  south: {
    lat: 1.29587,
    lng: 103.82,
    label: 'South',
    neighborhoods: ['Marina Bay', 'CBD / Raffles Place', 'Sentosa', 'HarbourFront', 'Telok Blangah', 'Tanjong Pagar', 'Bukit Merah', 'Pasir Panjang'],
  },
  east: {
    lat: 1.35735,
    lng: 103.94,
    label: 'East',
    neighborhoods: ['Tampines', 'Bedok', 'Changi', 'Pasir Ris', 'Marine Parade', 'Geylang', 'Katong', 'Simei'],
  },
  west: {
    lat: 1.35735,
    lng: 103.7,
    label: 'West',
    neighborhoods: ['Jurong East', 'Jurong West', 'Clementi', 'Tuas', 'Bukit Batok', 'Bukit Panjang', 'Pioneer', 'Boon Lay', 'Choa Chu Kang'],
  },
  central: {
    lat: 1.35735,
    lng: 103.82,
    label: 'Central',
    neighborhoods: ['Bishan', 'Ang Mo Kio', 'Toa Payoh', 'Orchard', 'Novena', 'Thomson', 'Serangoon', 'Balestier', 'Newton'],
  },
};

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula (km)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Find closest NEA region for a given latitude & longitude
 */
export function findNearestRegion(userLat: number, userLng: number): { region: Exclude<RegionKey, 'national'>; distanceKm: number } {
  let closestRegion: Exclude<RegionKey, 'national'> = 'central';
  let minDistance = Infinity;

  (Object.keys(REGION_COORDINATES) as Array<Exclude<RegionKey, 'national'>>).forEach((key) => {
    const coords = REGION_COORDINATES[key];
    const dist = calculateDistanceKm(userLat, userLng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestRegion = key;
    }
  });

  return {
    region: closestRegion,
    distanceKm: minDistance,
  };
}

/**
 * Search regions by neighborhood keyword
 */
export function searchRegionByNeighborhood(query: string): Exclude<RegionKey, 'national'> | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  for (const [region, data] of Object.entries(REGION_COORDINATES)) {
    if (data.label.toLowerCase().includes(clean)) {
      return region as Exclude<RegionKey, 'national'>;
    }
    const found = data.neighborhoods.some((n) => n.toLowerCase().includes(clean));
    if (found) {
      return region as Exclude<RegionKey, 'national'>;
    }
  }

  return null;
}
