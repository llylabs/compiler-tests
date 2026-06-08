import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    totalPosts: 6,
    totalAuthors: 3,
    totalCategories: 4,
    topTags: [
      {tag: "wasm", count: 4},
      {tag: "react", count: 3},
      {tag: "nex", count: 2},
    ],
    lastPublished: "2024-04-10",
  });
}
