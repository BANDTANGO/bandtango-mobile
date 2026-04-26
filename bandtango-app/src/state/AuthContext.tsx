/**
 * AuthContext — OAuth-backed authentication for Google, Facebook, and Instagram.
 *
 * Flow (web):
 *   1. signIn(provider) → redirects browser to /api/auth/{provider} on the backend.
 *   2. Backend completes the OAuth code-exchange and redirects back to the app
 *      with ?session=<token> in the URL.
 *   3. On mount, `bootstrapAuth()` looks for ?session=... in the URL, validates
 *      it against /api/auth/me, then stores it in localStorage for persistence.
 *   4. signOut() clears localStorage and resets user state.
 *
 * Swap AUTH_BASE to your real backend URL before deploying.
 */

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

const AUTH_BASE = 'https://bandtango-vision-dev-732971614822.us-south1.run.app:7070';

export type OAuthProvider = 'google' | 'facebook' | 'instagram';

/** Shape of the JSON payload delivered to /auth/callback by the backend. */
export interface CallbackPayload {
  access_token: string;
  expiry?: string;
  provider: OAuthProvider;
  token_type?: string;
  user: {
    email: string;
    email_verified?: boolean;
    family_name?: string;
    given_name?: string;
    hd?: string;
    name?: string;
    picture?: string;
    sub?: string;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: OAuthProvider;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  authError: boolean;
  clearAuthError: () => void;
  signIn: (provider: OAuthProvider) => void;
  signInAsGuest: () => void;
  /** Validates and hydrates a user session from an /auth/callback payload. */
  signInWithCallbackData: (payload: CallbackPayload) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ── OAuth entry-point URLs ──────────────────────────────────────────────────
// The backend handles the PKCE / code-exchange; these just kick off the flow.
const OAUTH_REDIRECT_URLS: Record<OAuthProvider, string> = {
  google:    `${AUTH_BASE}/api/auth/google`,
  facebook:  `${AUTH_BASE}/api/auth/facebook`,
  instagram: `${AUTH_BASE}/api/auth/instagram`,
};

const SESSION_KEY = 'bandtango_session_token';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}

function storeToken(token: string): void {
  try { localStorage.setItem(SESSION_KEY, token); } catch { /* SSR / native */ }
}

function clearToken(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* SSR / native */ }
}

/** On web, pluck ?session=... from the current URL then strip it from history. */
function consumeSessionFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('session');
  if (token) {
    params.delete('session');
    const clean = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', clean);
  }
  return token ?? null;
}

async function fetchMe(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${AUTH_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json() as Partial<AuthUser>;
    if (!data.id || !data.email) return null;
    return { ...data, token } as AuthUser;
  } catch {
    return null;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [loading, setLoading]     = useState(true);
  const [authError, setAuthError] = useState(false);

  // Bootstrap: handle /auth/callback redirect, then fall back to stored token.
  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      // ── Handle OAuth callback redirect ────────────────────────────────────
      // The backend redirects the browser to:
      //   http://localhost:8081/?session=<base64-encoded-json>
      // where the JSON has the shape: { access_token, provider, user, ... }
      // We decode it, validate the token against /api/auth/me, then sign in.
      if (typeof window !== 'undefined') {
        const params     = new URLSearchParams(window.location.search);
        const isCallback = params.has('session') ||
                           params.has('auth_callback') ||
                           params.has('code') ||
                           window.location.pathname.replace(/\/+$/, '') === '/auth/callback';

        if (isCallback) {
          console.log('[Auth] Handling callback. search:', window.location.search);

          // Clean the URL immediately so params don't linger on refresh.
          window.history.replaceState({}, '', '/');

          // ── Pattern A: base64 session param ───────────────────────────────
          const rawSession = params.get('session');
          if (rawSession) {
            try {
              const session = JSON.parse(atob(rawSession)) as CallbackPayload;
              const accessToken = session?.access_token;

              if (accessToken) {
                const res = await fetch(`${AUTH_BASE}/api/auth/me`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  cache: 'no-store',
                });

                if (res.ok) {
                  const me = await res.json() as CallbackPayload['user'] & { id?: string };
                  if (me?.email && !cancelled) {
                    storeToken(accessToken);
                    setUser({
                      id:       me.id ?? me.sub ?? me.email,
                      name:     me.name ?? (`${me.given_name ?? ''} ${me.family_name ?? ''}`.trim() || me.email),
                      email:    me.email,
                      avatar:   me.picture,
                      provider: (session.provider ?? 'google') as OAuthProvider,
                      token:    accessToken,
                    });
                    setLoading(false);
                    return;
                  }
                  console.error('[Auth] /api/auth/me missing email:', me);
                } else {
                  console.error(`[Auth] /api/auth/me failed: HTTP ${res.status}`);
                }
              } else {
                console.error('[Auth] Decoded session missing access_token:', session);
              }
            } catch (err) {
              console.error('[Auth] Failed to decode session param:', err);
            }
          }

          // ── Pattern B: code exchange ───────────────────────────────────────
          const code     = params.get('code');
          const provider = (params.get('provider') ?? 'google') as OAuthProvider;
          const state    = params.get('state') ?? undefined;

          if (code) {
            try {
              const res = await fetch(`${AUTH_BASE}/auth/callback`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ code, provider, ...(state ? { state } : {}) }),
                cache:   'no-store',
              });

              if (res.ok) {
                const payload = await res.json() as CallbackPayload;
                if (payload?.access_token && payload?.user?.email) {
                  if (!cancelled) {
                    storeToken(payload.access_token);
                    setUser({
                      id:       payload.user.sub ?? payload.user.email,
                      name:     payload.user.name ?? (`${payload.user.given_name ?? ''} ${payload.user.family_name ?? ''}`.trim() || payload.user.email),
                      email:    payload.user.email,
                      avatar:   payload.user.picture,
                      provider: (payload.provider ?? 'google') as OAuthProvider,
                      token:    payload.access_token,
                    });
                    setLoading(false);
                  }
                  return;
                }
                console.error('[Auth] Code exchange payload missing access_token or user.email:', payload);
              } else {
                const text = await res.text().catch(() => '(unreadable)');
                console.error(`[Auth] Code exchange failed: HTTP ${res.status}`, text);
              }
            } catch (err) {
              console.error('[Auth] Code exchange threw:', err);
            }
          }

          if (!rawSession && !code) {
            console.error('[Auth] Callback reached with no session or code param. search:', params.toString());
          }

          if (!cancelled) { setAuthError(true); setLoading(false); }
          return;
        }
      }

      // ── Normal session restore ─────────────────────────────────────────────
      const urlToken = consumeSessionFromUrl();
      const token    = urlToken ?? getStoredToken();

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      const me = await fetchMe(token);
      if (cancelled) return;

      if (me) {
        storeToken(token);
        setUser(me);
      } else {
        clearToken();
      }
      setLoading(false);
    }

    bootstrapAuth();
    return () => { cancelled = true; };
  }, []);

  const clearAuthError = useCallback(() => setAuthError(false), []);

  const signIn = useCallback((provider: OAuthProvider) => {
    // Redirect the browser to the backend OAuth entry point.
    // The backend will ultimately redirect back to this app with ?session=<token>.
    const url = OAUTH_REDIRECT_URLS[provider];
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }, []);

  /**
   * Validates a CallbackPayload from the OAuth redirect and signs the user in.
   * Returns true if the payload was valid, false otherwise.
   */
  const signInWithCallbackData = useCallback((payload: CallbackPayload): boolean => {
    const { access_token, provider, user } = payload;
    if (!access_token || !user?.email) return false;

    storeToken(access_token);
    setUser({
      id:       user.sub ?? user.email,
      name:     user.name ?? (`${user.given_name ?? ''} ${user.family_name ?? ''}`.trim() || user.email),
      email:    user.email,
      avatar:   user.picture,
      provider: (provider ?? 'google') as OAuthProvider,
      token:    access_token,
    });
    return true;
  }, []);

  /** Temporary: sets a placeholder user so the protected navigator renders. */
  const signInAsGuest = useCallback(() => {
    setUser({
      id:       'guest',
      name:     'Guest',
      email:    'guest@bandtango.local',
      provider: 'google',
      token:    'guest-token',
    });
  }, []);

  const signOut = useCallback(async () => {
    clearToken();
    setUser(null);
    try {
      // Tell the backend to invalidate the session (best-effort).
      const token = getStoredToken();
      if (token) {
        await fetch(`${AUTH_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, signIn, signInAsGuest, signInWithCallbackData, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
