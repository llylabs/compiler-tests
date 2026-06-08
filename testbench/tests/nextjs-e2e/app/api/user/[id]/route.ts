import { NextResponse } from 'next/server';

const USERS = {
  "u1": { id: "u1", name: "Alice", role: "admin" },
  "u2": { id: "u2", name: "Bob", role: "user" },
};

export async function GET(request) {
  // params is on request.params in the lly synth (matches App Router)
  const id = request.params.id;
  const user = USERS[id];
  if (!user) {
    return NextResponse.json({ error: "not found", id }, { status: 404 });
  }
  return NextResponse.json(user);
}
