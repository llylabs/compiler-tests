import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    users: [
      {id: 1, name: "Alice", role: "admin"},
      {id: 2, name: "Bob", role: "user"},
    ],
    total: 2,
    page: 1,
  });
}
