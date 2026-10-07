/**
 * Health check module to monitor NEA real-time air quality APIs:
 * - https://api-open.data.gov.sg/v2/real-time/api/psi (PSI)
 * - https://api-open.data.gov.sg/v2/real-time/api/pm25 (PM2.5)
 */

export async function checkApiHealth() {
  const startTime = Date.now();
  const checks = {
    psiApi: {
      url: 'https://api-open.data.gov.sg/v2/real-time/api/psi',
      status: 'unknown',
      httpStatus: 0,
      responseTimeMs: 0,
      readingsAvailable: false,
      lastUpdated: null,
      error: null,
    },
    pm25Api: {
      url: 'https://api-open.data.gov.sg/v2/real-time/api/pm25',
      status: 'unknown',
      httpStatus: 0,
      responseTimeMs: 0,
      readingsAvailable: false,
      lastUpdated: null,
      error: null,
    },
  };

  // Helper to ping endpoint with timeout
  async function pingEndpoint(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const start = Date.now();
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SG-AirWatch-HealthCheck/1.0',
        },
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - start;
      const data = await res.json();
      const hasItems = Boolean(data && data.data && Array.isArray(data.data.items) && data.data.items.length > 0);
      const latestUpdate = hasItems ? data.data.items[0].updatedTimestamp || data.data.items[0].timestamp : null;

      return {
        status: res.ok && hasItems ? 'healthy' : 'degraded',
        httpStatus: res.status,
        responseTimeMs: latency,
        readingsAvailable: hasItems,
        lastUpdated: latestUpdate,
        error: res.ok ? null : `HTTP status ${res.status}`,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const latency = Date.now() - start;
      return {
        status: 'down',
        httpStatus: 0,
        responseTimeMs: latency,
        readingsAvailable: false,
        lastUpdated: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const [psiResult, pm25Result] = await Promise.all([
    pingEndpoint(checks.psiApi.url),
    pingEndpoint(checks.pm25Api.url),
  ]);

  checks.psiApi = { ...checks.psiApi, ...psiResult };
  checks.pm25Api = { ...checks.pm25Api, ...pm25Result };

  const allHealthy = checks.psiApi.status === 'healthy' && checks.pm25Api.status === 'healthy';
  const anyDown = checks.psiApi.status === 'down' && checks.pm25Api.status === 'down';
  const overallStatus = allHealthy ? 'healthy' : (anyDown ? 'down' : 'degraded');

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    services: {
      psi: checks.psiApi,
      pm25: checks.pm25Api,
    },
    system: {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage ? {
        heapUsedMB: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10,
        rssMB: Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10,
      } : undefined,
    },
  };
}

/**
 * Express / Node HTTP request handler for /api/health.js and /api/health
 */
export default async function healthHandler(req, res) {
  try {
    const health = await checkApiHealth();
    const httpStatusCode = health.status === 'down' ? 503 : (health.status === 'degraded' ? 200 : 200);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(httpStatusCode).json(health);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Internal health check error',
    });
  }
}
