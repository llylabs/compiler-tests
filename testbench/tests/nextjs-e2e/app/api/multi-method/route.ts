import { NextResponse } from 'next/server'

export function GET()    { return NextResponse.json({ m: "GET" }); }
export function POST()   { return NextResponse.json({ m: "POST" }); }
export function PUT()    { return NextResponse.json({ m: "PUT" }); }
export function DELETE() { return NextResponse.json({ m: "DELETE" }); }
export function PATCH()  { return NextResponse.json({ m: "PATCH" }); }
