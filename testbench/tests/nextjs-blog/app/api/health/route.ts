import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    status: "healthy",
    runtime: "nex",
    version: "0.1.0",
    uptime: Date.now(),
    features: {
      ssr: true,
      apiRoutes: true,
      staticFiles: true,
      fileRouting: true,
    },
  });
}
