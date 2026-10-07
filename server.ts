import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler, { checkApiHealth } from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Health Check routes (both /api/health and /api/health.js)
app.get('/api/health', healthHandler);
app.get('/api/health.js', healthHandler);

// Simple in-memory cache to be resilient to NEA rate limits or temporary drops
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// Helper to fetch NEA APIs with caching and fallback
async function fetchNeaWithCache(url: string, cacheKey: string) {
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL_MS) {
    return { data: cache[cacheKey].data, cached: true };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SG-AirWatch/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`NEA upstream returned status ${response.status}`);
    }

    const json = await response.json();
    cache[cacheKey] = {
      data: json,
      timestamp: now,
    };
    return { data: json, cached: false };
  } catch (err) {
    // Return stale cache if available
    if (cache[cacheKey]) {
      return { data: cache[cacheKey].data, cached: true, stale: true };
    }
    throw err;
  }
}

// Proxy endpoint for PSI
app.get('/api/psi', async (req, res) => {
  try {
    const dateParam = typeof req.query.date === 'string' ? req.query.date : '';
    const url = dateParam
      ? `https://api-open.data.gov.sg/v2/real-time/api/psi?date=${encodeURIComponent(dateParam)}`
      : 'https://api-open.data.gov.sg/v2/real-time/api/psi';
    
    const cacheKey = `psi_${dateParam || 'latest'}`;
    const result = await fetchNeaWithCache(url, cacheKey);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(result.data);
  } catch (err: any) {
    console.error('Error fetching PSI:', err);
    res.status(502).json({
      code: -1,
      errorMsg: err?.message || 'Failed to fetch PSI data from upstream',
      data: null,
    });
  }
});

// Proxy endpoint for PM2.5
app.get('/api/pm25', async (req, res) => {
  try {
    const dateParam = typeof req.query.date === 'string' ? req.query.date : '';
    const url = dateParam
      ? `https://api-open.data.gov.sg/v2/real-time/api/pm25?date=${encodeURIComponent(dateParam)}`
      : 'https://api-open.data.gov.sg/v2/real-time/api/pm25';

    const cacheKey = `pm25_${dateParam || 'latest'}`;
    const result = await fetchNeaWithCache(url, cacheKey);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(result.data);
  } catch (err: any) {
    console.error('Error fetching PM2.5:', err);
    res.status(502).json({
      code: -1,
      errorMsg: err?.message || 'Failed to fetch PM2.5 data from upstream',
      data: null,
    });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG AirWatch server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
