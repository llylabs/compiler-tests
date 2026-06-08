"use client";
// H-08 SSR-side fixture: exercises React.useId().
//   1. `React.useId()` returns a stable, defined string identifier on the
//      server.  The exact shape is opaque (React uses ":r0:", ":r1:" etc.),
//      but the SSR contract is: it must NEVER return undefined or throw,
//      because user code threads the id into aria-labelledby / htmlFor.
//   2. The value MUST be a string that React then echoes verbatim into the
//      htmlFor / id attributes — broken stubs that returned `undefined`
//      would corrupt the markup (`htmlFor="undefined"`).
//   3. Named-import binding `useId` (top-level) and `React.useId` member
//      access both resolve to the same SSR stub — covers the dual binding
//      surface created by the bundler.
//
// Verified by curl-checking the SSR HTML; client-side React replaces the
// stub during hydration (Phase C2 bundle).  See expect/GET_h08-useid.expect.
import React, { useId } from "react";

function Field(props) {
  // Member-access binding from the default React import.
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id}>{props.label}</label>
      <input id={id} type="text" />
    </div>
  );
}

export default function H08UseIdPage() {
  // Named-import binding — must also resolve to the SSR stub without throwing.
  const headingId = useId();
  return (
    <div>
      <h1 id={headingId}>H08 useId</h1>
      <p data-testid="heading-id">Id1: {headingId}</p>
      <Field label="Name" />
      <Field label="Email" />
    </div>
  );
}
