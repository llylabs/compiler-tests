import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    api_version: "v2",
    posts: [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ],
  });
}
