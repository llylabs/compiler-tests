import { NextResponse } from 'next/server'

export async function POST(request) {
  var data = request.json();
  return NextResponse.json({ ok: true, echoed: data });
}
