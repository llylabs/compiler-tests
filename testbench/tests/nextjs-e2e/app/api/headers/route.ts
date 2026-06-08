import { NextResponse } from 'next/server'

export function GET(request) {
  const ua = request.headers.get('User-Agent') || 'unknown';
  const host = request.headers.get('Host') || 'unknown';
  return NextResponse.json({ userAgent: ua, host: host });
}
