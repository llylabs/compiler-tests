// @expect-contains: "status":"ok"
// @expect-contains: "runtime":"nex"
import { NextResponse } from 'next/server'

// --- API Route handler (like app/api/health/route.ts) ---
function GET() {
  return NextResponse.json({ status: 'ok', runtime: 'nex' })
}

// --- Execute and validate ---
var response = GET();
if (response.status !== 200) throw new Error('Expected status 200, got ' + response.status);
if (!response.body.includes('"status":"ok"')) throw new Error('Missing status in body');
console.log(response.body);
