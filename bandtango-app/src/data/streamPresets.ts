/** Shared preset station list — consumed by HLSListeningScreen and HomeScreen. */
export const PRESET_STREAMS = [
  { label: 'SomaFM Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-aac',  type: 'icecast' as const },
  { label: 'SomaFM Space Station', url: 'https://ice1.somafm.com/spacestation-128-aac', type: 'icecast' as const },
  { label: 'SomaFM Secret Agent', url: 'https://ice1.somafm.com/secretagent-128-aac',  type: 'icecast' as const },
] as const;

export type StreamType = 'hls' | 'icecast';
export type PresetStream = (typeof PRESET_STREAMS)[number];

/**
 * Hostnames that are verified to send `Access-Control-Allow-Origin` headers on
 * their streams, making `fetch()` for ICY metadata safe from a browser context.
 *
 * This set is mutable at runtime so user-confirmed presets can be added via
 * `addCorsSafeOrigin(url)` without a page reload.
 */
export const CORS_SAFE_ORIGINS = new Set<string>([
  // ── SomaFM CDN nodes ────────────────────────────────────────────────────
  'ice1.somafm.com',
  'ice2.somafm.com',
  'ice3.somafm.com',
  'ice4.somafm.com',
  'ice5.somafm.com',
  'ice6.somafm.com',
  'ice.somafm.com',
  'streams.somafm.com',
  // ── Other verified CORS-friendly public stations ─────────────────────────
  'stream.nightwave.plaza',          // Nightwave Plaza
  'nightwave.plaza',
  'playerservices.streamtheworld.com', // iHeart / TuneIn CDN
  'stream.streamtheworld.com',
  'listen.181fm.com',
  'broadcasts.99music.it',
  'stream.radioparadise.com',
  // ── Development / local servers ──────────────────────────────────────────
  'localhost',
  '127.0.0.1',
]);

/** Register an additional origin as CORS-safe (e.g. user-confirmed presets). */
export function addCorsSafeOrigin(urlOrHost: string): void {
  try {
    const host = new URL(urlOrHost).hostname;
    CORS_SAFE_ORIGINS.add(host);
  } catch {
    // plain hostname passed directly
    CORS_SAFE_ORIGINS.add(urlOrHost);
  }
}

/** Returns true when the URL's hostname is in the verified CORS whitelist. */
export function isCorsSafeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return CORS_SAFE_ORIGINS.has(host);
  } catch {
    return false;
  }
}
