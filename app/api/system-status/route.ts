import { NextResponse } from 'next/server';
import { backendApi, buildInternalUrl, safeJsonFetch, getBackendBase, getSiteOrigin } from '@/lib/origin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const origin = getSiteOrigin();
  const backend = getBackendBase();

  const [internalHealth, backendHealth] = await Promise.all([
    safeJsonFetch(buildInternalUrl('/api/health')),
    safeJsonFetch(backendApi('health')),
  ]);

  return NextResponse.json({
    success: true,
    origin,
    backend,
    internalHealth,
    backendHealth,
    timestamp: new Date().toISOString(),
  });
}
