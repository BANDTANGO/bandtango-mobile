/**
 * Singleton Web Audio analyser node shared across the app.
 *
 * Only one HTMLAudioElement is playing at a time (stored in NowPlayingContext's
 * hlsAudioRef). When LivePlayerCard creates a new element it calls
 * `wireAudioElement(audio)` to route it through the shared AudioContext.
 * EqualizerGraphic calls `getAnalyserData()` each animation frame to read
 * frequency bins without ever touching the audio element directly.
 *
 * The MediaElementSourceNode can only be created once per element. We track
 * which element is currently wired and skip re-wiring if it hasn't changed.
 */

let _ctx: AudioContext | null = null;
let _source: MediaElementAudioSourceNode | null = null;
let _analyser: AnalyserNode | null = null;
let _wiredElement: HTMLAudioElement | null = null;
const FFT_SIZE = 64;

function getCtx(): AudioContext | null {
  if (_ctx) return _ctx;
  const Ctor =
    (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try { _ctx = new Ctor(); } catch { return null; }
  return _ctx;
}

/**
 * Wire a new HTMLAudioElement into the shared AudioContext.
 * Call this immediately after creating the Audio element (before play()).
 * Safe to call multiple times — no-ops if the same element is already wired.
 */
export function wireAudioElement(audio: HTMLAudioElement): void {
  if (audio === _wiredElement) return; // already wired — no-op

  const ctx = getCtx();
  if (!ctx) return;

  // Tear down the old source node if the element changed.
  if (_source) {
    try { _source.disconnect(); } catch { /* ignore */ }
    _source = null;
  }

  try {
    if (ctx.state === 'suspended') { ctx.resume().catch(() => undefined); }

    _source = ctx.createMediaElementSource(audio);
    // Destination first — audio must reach speakers.
    _source.connect(ctx.destination);

    if (!_analyser) {
      _analyser = ctx.createAnalyser();
      _analyser.fftSize = FFT_SIZE;
      _analyser.smoothingTimeConstant = 0.8;
    }
    _source.connect(_analyser);
    _wiredElement = audio;
  } catch {
    // createMediaElementSource can throw if crossOrigin wasn't set in time.
    // In that case we leave _analyser disconnected; EqualizerGraphic falls back.
    _source = null;
    _wiredElement = null;
  }
}

/**
 * Returns a Uint8Array of frequency magnitudes (0-255) the same size as
 * analyser.frequencyBinCount, or null if the analyser isn't ready.
 * The returned array is the analyser's own internal buffer — copy it if needed.
 */
export function getAnalyserData(): { data: Uint8Array; binCount: number } | null {
  if (!_analyser) return null;
  const ctx = getCtx();
  if (ctx?.state === 'suspended') { ctx.resume().catch(() => undefined); }
  const binCount = _analyser.frequencyBinCount;
  const data = new Uint8Array(binCount);
  _analyser.getByteFrequencyData(data);
  return { data, binCount };
}

export function resumeCtx(): void {
  const ctx = getCtx();
  if (ctx?.state === 'suspended') { ctx.resume().catch(() => undefined); }
}
