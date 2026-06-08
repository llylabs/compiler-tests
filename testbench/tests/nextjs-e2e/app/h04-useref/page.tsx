"use client";
// H-04 SSR-side fixture: exercises useRef + forwardRef + JSX `ref` attr.
//   1. `useRef(initial)` returns a fresh { current: initial } object that
//      survives across reads inside one render — the value rendered must be
//      the literal initial, NOT undefined or the ref object itself.
//   2. forwardRef-wrapped components are callable (forwardRef returns the
//      component identity in our SSR stub).  The wrapper accepts (props)
//      on SSR — the `ref` second arg is undefined, but that's expected and
//      must not crash.
//   3. JSX `ref={...}` attributes are React-internal and MUST be stripped
//      from the rendered HTML.  Whether `ref` is a callback, an object, or
//      undefined, no `ref="..."` attribute may appear in the SSR output.
//
// Verified by curl-checking the SSR HTML; imperative ref-attach happens on
// the client only (the testbench has no headless browser).
import React from "react";

// forwardRef wrapper: signature `(props, ref) => element`.  On SSR the ref
// arg is undefined because hyperscript_create only forwards props to the
// closure.  The ref prop is also stripped from the rendered <input>.
const FancyInput = React.forwardRef(function FancyInput(props, ref) {
  return <input ref={ref} placeholder={props.placeholder} />;
});

export default function H04UseRefPage() {
  // Plain primitive ref — read .current twice to confirm the same value
  // is returned both times (no implicit reset on read).
  const r1 = React.useRef(42);
  const r2 = React.useRef("hello");
  // Object initial — confirm useRef doesn't wrap-or-reset complex initials.
  const r3 = React.useRef({ id: 7 });
  // Ref passed to forwardRef child — SSR must not blow up; child renders
  // `<input>` without any leaked `ref` attribute.
  const inputRef = React.useRef(null);

  return (
    <div>
      <h1>H04 useRef</h1>
      <p data-testid="r1">RefValue: {r1.current}</p>
      <p data-testid="r1again">Again: {r1.current}</p>
      <p data-testid="r2">String: {r2.current}</p>
      <p data-testid="r3">ObjectId: {r3.current.id}</p>
      <FancyInput ref={inputRef} placeholder="type here" />
    </div>
  );
}
