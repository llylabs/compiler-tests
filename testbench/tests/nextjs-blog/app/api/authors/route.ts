import { NextResponse } from 'next/server'

export function GET() {
  var authors = [
    {id: 1, name: "Alice Chen", role: "Admin", postCount: 3},
    {id: 2, name: "Bob Martinez", role: "Editor", postCount: 2},
    {id: 3, name: "Carol Kim", role: "Author", postCount: 1},
  ];
  return NextResponse.json({ authors: authors, total: authors.length });
}
