import { NextResponse } from 'next/server';

function validate(body) {
  const errors = {};
  if (!body || typeof body !== 'object') {
    errors["_root"] = "body must be an object";
    return errors;
  }
  if (!body.email || typeof body.email !== 'string' || body.email.indexOf("@") < 0) {
    errors["email"] = "invalid email";
  }
  if (!body.age || typeof body.age !== 'number' || body.age < 13) {
    errors["age"] = "age must be 13+";
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export async function POST(request) {
  const body = request.json();
  const errors = validate(body);
  if (errors) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }
  return NextResponse.json({ ok: true, received: body });
}
