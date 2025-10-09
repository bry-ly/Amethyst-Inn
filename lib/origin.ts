import { headers } from 'next/headers';

/**
 * Returns the fully-qualified site origin for server components / route handlers.
 * It prefers explicitly configured public site URLs so that builds and serverless
 * environments (Vercel) resolve a stable origin instead of relying on headers.
 */
export function getSiteOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (envUrl) {
    const normalized = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
    return normalized.replace(/\/$/, '');
  }
  const h = headers();
  // Some type defs may incorrectly mark headers() as possibly async; ensure usable object.
  const xfHost = (h as any).get?.('x-forwarded-host') || (h as any).get?.('host');
  const host = xfHost || 'localhost:3000';
  const proto = (h as any).get?.('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`.replace(/\/$/, '');
}

/** Backend base (no trailing /api). */
export function getBackendBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '');
}

/** Build an absolute internal URL from a path (starting with /). */
export function buildInternalUrl(path: string): string {
  const origin = getSiteOrigin();
  return `${origin}${path.startsWith('/') ? path : '/' + path}`;
}

/** Convenience helper to build a backend API endpoint path. */
export function backendApi(path: string): string {
  const base = getBackendBase();
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/api/${clean}`.replace(/\/+$/, '');
}

/** Fetch JSON with graceful text fallback; never throws, returns envelope. */
export async function safeJsonFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, { cache: 'no-store', ...init });
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch {
      return { ok: res.ok, status: res.status, data: text };
    }
  } catch (e: any) {
    return { ok: false, status: 0, data: String(e) };
  }
}
