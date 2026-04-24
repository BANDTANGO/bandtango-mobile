/**
 * ICY metadata reader — proxied through the local backend.
 *
 * The backend endpoint handles the raw Icecast byte-protocol so the browser
 * never has to send custom headers (which trigger CORS preflight) directly
 * to the stream server.
 *
 * Endpoint: GET /api/station/icemeta?url=<stream-url>
 * Response: { artist: string; title: string; raw: string }
 */

const API_BASE = 'http://localhost:7070';

export interface IcyMeta {
  title: string;
  artist: string;
  /** Raw StreamTitle value, e.g. "Artist - Title" */
  raw: string;
}

/**
 * Fetch ICY metadata for a stream URL via the backend proxy.
 *
 * @param url      Icecast/ShoutCast stream URL
 * @param timeoutMs Maximum time before aborting (default 12 s)
 */
export async function fetchIcyMeta(
  url: string,
  timeoutMs = 12_000,
): Promise<IcyMeta | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const endpoint = `${API_BASE}/api/station/icemeta?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) return null;

    const data = await res.json() as { artist?: string; title?: string; raw?: string };
    const title  = data.title?.trim()  ?? '';
    const artist = data.artist?.trim() ?? '';
    const raw    = data.raw?.trim()    ?? '';

    if (!title && !artist) return null;
    var meta: IcyMeta = { title, artist, raw };
    console.log(`[ICY META] ${url} → ${artist} - ${title}`);

    return meta;
  } catch (e) {
    // AbortError from timeout, network error — safe to swallow.
    console.error(`[ICY META] Error fetching metadata for ${url}:`, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}