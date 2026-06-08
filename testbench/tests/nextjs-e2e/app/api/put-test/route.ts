import { NextResponse } from 'next/server';

export function PUT(request) {
  var body = request.json();
  return NextResponse.json({ verb: "PUT", body }, { status: 200 });
}

export function DELETE(request) {
  return NextResponse.json({ verb: "DELETE", url: request.url });
}

export function PATCH() {
  return NextResponse.json({ verb: "PATCH", patched: true });
}
