import { NextResponse } from 'next/server';

const DOCS = [
  { id: 1, title: "Hello World", body: "First post" },
  { id: 2, title: "Next.js Guide", body: "Comprehensive guide" },
  { id: 3, title: "Async Patterns", body: "Promise.then chains" },
];

export async function GET(request) {
  const q = request.nextUrl.searchParams.get("q") || "";
  var results = [];
  if (q) {
    const lo = q.toLowerCase();
    for (var i = 0; i < DOCS.length; i++) {
      const d = DOCS[i];
      if (d.title.toLowerCase().indexOf(lo) >= 0 || d.body.toLowerCase().indexOf(lo) >= 0) {
        results.push(d);
      }
    }
  }
  return NextResponse.json({ q, count: results.length, results });
}
