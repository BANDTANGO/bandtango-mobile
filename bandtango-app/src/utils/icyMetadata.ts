/**
 * ICY metadata reader (Icecast / ShoutCast byte-offset protocol).
 *
 * Workflow:
 *  1. Fetch the stream with `Icy-MetaData: 1` header.
 *  2. Server responds with `icy-metaint: N` — audio bytes between metadata blocks.
 *  3. The body is interleaved: [N audio bytes] [1 len byte] [len*16 metadata bytes] …
 *  4. Parse `StreamTitle='Artist - Title'` from the first non-empty metadata block.
 *  5. Cancel the stream reader immediately — we do not hold the connection open.
 *
 * Returns null on CORS failure, missing metaint, timeout, or parse failure.
 */

function concatUint8(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export interface IcyMeta {
  title: string;
  artist: string;
  /** Raw StreamTitle value, e.g. "Artist - Title" */
  raw: string;
}

/**
 * One-shot ICY metadata fetch. Opens the stream, skips audio bytes up to the
 * first metadata block, parses the title, then immediately cancels the reader.
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
    const res = await fetch(url, {
      headers: {
        'Icy-MetaData': '1',
        // Some servers gate on a browser-style User-Agent for CORS pre-flight.
        'User-Agent': 'Mozilla/5.0',
      },
      signal: ctrl.signal,
      // Prevent network layer from buffering – we want raw body chunks.
      cache: 'no-store',
    });

    const metaint = parseInt(res.headers.get('icy-metaint') ?? '0', 10);
    if (!metaint || !res.body) return null;

    const reader = res.body.getReader();
    const dec = new TextDecoder('utf-8', { fatal: false });

    // State machine:
    //   audioRemaining  — audio bytes left before the next metadata block starts
    //   phase           — 'audio' | 'metalen' | 'metabody'
    //   metaLen         — byte length of the upcoming metadata blob (len byte × 16)
    //   metaBuf         — accumulated metadata bytes
    let audioRemaining = metaint;
    let phase: 'audio' | 'metalen' | 'metabody' = 'audio';
    let metaLen = 0;
    let metaBuf: Uint8Array = new Uint8Array(0);
    let carryover: Uint8Array = new Uint8Array(0);

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Merge any leftover from the previous iteration.
      let chunk = carryover.length ? concatUint8(carryover, value) : value;
      carryover = new Uint8Array(0);
      let i = 0;

      while (i < chunk.length) {
        if (phase === 'audio') {
          const skip = Math.min(audioRemaining, chunk.length - i);
          i += skip;
          audioRemaining -= skip;
          if (audioRemaining === 0) {
            phase = 'metalen';
          }
        } else if (phase === 'metalen') {
          metaLen = chunk[i] * 16;
          i++;
          if (metaLen === 0) {
            // Empty metadata block — reset for next audio segment.
            audioRemaining = metaint;
            phase = 'audio';
          } else {
            metaBuf = new Uint8Array(0);
            phase = 'metabody';
          }
        } else {
          // phase === 'metabody'
          const bytesLeft = metaLen - metaBuf.length;
          const available = chunk.length - i;
          const take = Math.min(bytesLeft, available);
          metaBuf = concatUint8(metaBuf, chunk.slice(i, i + take));
          i += take;

          if (metaBuf.length === metaLen) {
            // We have a complete metadata block.
            const metaStr = dec.decode(metaBuf).replace(/\0+$/, '');
            const m = metaStr.match(/StreamTitle='([^']*)'/i);
            if (m) {
              reader.cancel().catch(() => undefined);
              const raw = m[1].trim();
              const dashIdx = raw.indexOf(' - ');
              return dashIdx !== -1
                ? { artist: raw.slice(0, dashIdx).trim(), title: raw.slice(dashIdx + 3).trim(), raw }
                : { artist: '', title: raw, raw };
            }
            // Non-empty block but no StreamTitle — reset.
            audioRemaining = metaint;
            phase = 'audio';
          } else {
            // Need more data to complete the metadata body.
            carryover = chunk.slice(i);
            break outer; // wait for next reader chunk
          }
        }
      }
    }
  } catch {
    // AbortError from timeout, CORS failure, network error — all safe to swallow.
  } finally {
    clearTimeout(timer);
  }

  return null;
}
