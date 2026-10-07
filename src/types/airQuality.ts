export type RegionKey = 'north' | 'south' | 'east' | 'west' | 'central' | 'national';

export interface RegionMetadata {
  name: string;
  labelLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface PsiItemReadings {
  psi_twenty_four_hourly?: Record<string, number>;
  pm25_twenty_four_hourly?: Record<string, number>;
  pm25_sub_index?: Record<string, number>;
  pm10_twenty_four_hourly?: Record<string, number>;
  pm10_sub_index?: Record<string, number>;
  so2_twenty_four_hourly?: Record<string, number>;
  so2_sub_index?: Record<string, number>;
  no2_one_hour_max?: Record<string, number>;
  o3_eight_hour_max?: Record<string, number>;
  o3_sub_index?: Record<string, number>;
  co_eight_hour_max?: Record<string, number>;
  co_sub_index?: Record<string, number>;
}

export interface PsiApiResponse {
  code: number;
  errorMsg?: string;
  data: {
    regionMetadata: RegionMetadata[];
    items: Array<{
      date: string;
      timestamp: string;
      updatedTimestamp?: string;
      readings: PsiItemReadings;
    }>;
  };
}

export interface Pm25ApiResponse {
  code: number;
  errorMsg?: string;
  data: {
    regionMetadata: RegionMetadata[];
    items: Array<{
      date: string;
      timestamp: string;
      updatedTimestamp?: string;
      readings: {
        pm25_one_hourly: Record<string, number>;
      };
    }>;
  };
}

export interface PsiBandInfo {
  band: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  range: string;
  colorHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentBg: string;
  accentGlow: string;
  generalAdvisory: string;
  vulnerableAdvisory: string;
  healthyPersonAdvisory: string;
  hazeIntensity: number; // 0 (clear) to 1 (extreme haze)
}

export interface Pm25BandInfo {
  band: 'Normal' | 'Elevated' | 'High' | 'Very High';
  bandNumber: 'Band I' | 'Band II' | 'Band III' | 'Band IV';
  range: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  activityGuide: string;
}

export interface HourlyTrendPoint {
  timestamp: string;
  hourLabel: string;
  psi: number | null;
  pm25_one_hourly: number | null;
  pm25_twenty_four_hourly?: number | null;
  pm10_twenty_four_hourly?: number | null;
  o3_eight_hour_max?: number | null;
  no2_one_hour_max?: number | null;
  so2_twenty_four_hourly?: number | null;
  co_eight_hour_max?: number | null;
}

export interface ApiHealthReport {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  totalDurationMs: number;
  uptimeSeconds: number;
  services: {
    psi: {
      url: string;
      status: string;
      httpStatus: number;
      responseTimeMs: number;
      readingsAvailable: boolean;
      lastUpdated: string | null;
      error: string | null;
    };
    pm25: {
      url: string;
      status: string;
      httpStatus: number;
      responseTimeMs: number;
      readingsAvailable: boolean;
      lastUpdated: string | null;
      error: string | null;
    };
  };
  system?: {
    environment: string;
    nodeVersion: string;
    memoryUsage?: {
      heapUsedMB: number;
      rssMB: number;
    };
  };
}
