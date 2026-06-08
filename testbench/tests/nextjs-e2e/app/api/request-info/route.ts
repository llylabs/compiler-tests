import { NextResponse } from 'next/server';

export function GET(request) {
  return NextResponse.json({
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
  });
}

export function HEAD() {
  return NextResponse.json({ ok: true });
}

export function OPTIONS() {
  var resp = NextResponse.json({ allowed: "GET, POST, HEAD, OPTIONS" });
  resp.headers['Allow'] = 'GET, POST, HEAD, OPTIONS';
  return resp;
}
