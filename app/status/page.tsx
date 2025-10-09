import React from "react";
import { headers } from "next/headers";

async function getJson(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
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

export const dynamic = "force-dynamic";

// Build absolute URL for internal route when rendering on server
function getSiteOrigin() {
  // Prefer explicit public site URL if provided
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (envUrl) {
    const normalized = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
    return normalized.replace(/\/$/, '');
  }
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`.replace(/\/$/, '');
}

export default async function StatusPage() {
  const backend = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "");
  const origin = getSiteOrigin();
  const internal = await getJson(`${origin}/api/health`);
  const direct = await getJson(`${backend}/api/health`);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Frontend ↔ Backend status</h1>
      <p>
        NEXT_PUBLIC_API_BASE: <code>{backend}</code>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h2>Internal proxy: GET {origin}/api/health</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(internal, null, 2)}</pre>
        </section>
        <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <h2>Direct backend: GET {backend}/api/health</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(direct, null, 2)}</pre>
        </section>
      </div>
      <p style={{ marginTop: 16, color: "#666" }}>
        Tip: If internal is failing but direct works, the app route proxy may be misconfigured. If both fail, check the backend URL or deployment.
      </p>
    </div>
  );
}
