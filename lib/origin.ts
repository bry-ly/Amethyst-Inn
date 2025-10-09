// NOTE: Do NOT statically import 'next/headers' here because this file is used by
// both server and client code (dynamic imports in client components). A static
// import forces Next.js to treat the module as server-only and breaks the client build.
// We instead lazy-load headers() only when we detect a server runtime.
// (Vercel build error referenced: "You're importing a component that needs 'next/headers'")

type HeaderGetter = () => Headers;
let serverHeaders: HeaderGetter | null = null;
function tryLoadHeaders(): HeaderGetter | null {
  if (serverHeaders !== null) return serverHeaders; // cached attempt
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('next/headers') as { headers: HeaderGetter };
    if (typeof mod.headers === 'function') {
      serverHeaders = mod.headers;
      return serverHeaders;
    }
  } catch {
    serverHeaders = null;
  }
  return serverHeaders;
}

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
  const headersFn = tryLoadHeaders();
  if (headersFn) {
    try {
      const h = headersFn();
      const xfHost = h.get('x-forwarded-host') || h.get('host');
      const host = xfHost || 'localhost:3000';
      const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/$/, '');
    } catch {
      // fall through to default
    }
  }
  return 'http://localhost:3000';
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

// Warn in production if backend base looks like localhost (misconfiguration safeguard)
if (process.env.NODE_ENV === 'production') {
  const bb = getBackendBase();
  if (/^https?:\/\/localhost:?\d*/i.test(bb)) {
    // eslint-disable-next-line no-console
    console.warn('[origin] WARNING: backend base is localhost in production build:', bb);
  }
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
