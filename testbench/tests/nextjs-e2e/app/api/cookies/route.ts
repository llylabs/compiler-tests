import { NextResponse } from 'next/server'

export function GET(request) {
  const session = request.cookies.get('session');
  return NextResponse.json({
    seen: session ? session.value : null,
    cookieCount: request.cookies.getAll().length,
  });
}

export function POST() {
  const response = NextResponse.json({ ok: true });
  // Set-Cookie via headers
  response.headers['Set-Cookie'] = 'session=abc123; Path=/; HttpOnly';
  return response;
}
