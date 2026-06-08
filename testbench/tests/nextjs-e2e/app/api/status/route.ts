import { NextResponse } from 'next/server';

export function GET(request) {
  const sp = request.nextUrl.searchParams;
  const want = sp.get("want");
  if (want === "404") {
    return NextResponse.json({ err: "not found" }, { status: 404 });
  }
  if (want === "500") {
    return NextResponse.json({ err: "server error" }, { status: 500 });
  }
  if (want === "201") {
    return NextResponse.json({ created: true }, { status: 201 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
