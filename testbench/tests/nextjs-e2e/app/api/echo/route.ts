import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ method: "GET", message: "Use POST to send data" });
}

export function POST(request) {
  var data = request.json();
  return NextResponse.json({ method: "POST", received: data });
}
