import React from "react";
import { getBackendBase, getSiteOrigin, safeJsonFetch, buildInternalUrl, backendApi } from "@/lib/origin";

// Deprecated local getJson replaced by shared safeJsonFetch util.

export const dynamic = "force-dynamic";

// Build absolute URL for internal route when rendering on server
// Origin helper centralized in lib/origin.ts

export default async function StatusPage() {
  const backend = getBackendBase();
  const origin = getSiteOrigin();
  // Use new system-status aggregated endpoint (self) plus direct calls for comparison
  const [systemStatus, internal, direct] = await Promise.all([
    safeJsonFetch(buildInternalUrl('/api/system-status')),
    safeJsonFetch(buildInternalUrl('/api/health')),
    safeJsonFetch(backendApi('health')),
  ]);

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
        <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, gridColumn: "1 / span 2" }}>
          <h2>Aggregated: GET {origin}/api/system-status</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(systemStatus, null, 2)}</pre>
        </section>
      </div>
      <p style={{ marginTop: 16, color: "#666" }}>
        Tip: If internal fails but direct works, app route proxy/middleware may be misconfigured. If direct fails, backend is unreachable or CORS blocked.
      </p>
    </div>
  );
}
