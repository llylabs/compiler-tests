"use client";
// H-01 SSR-side fixture: exercises useState's three SSR-relevant edge cases.
//   1. Plain initial value: `useState(7)` -> renders 7
//   2. Lazy initialiser: `useState(() => 21 * 2)` -> initialiser is INVOKED
//      exactly once and the slot value is `42`, NOT the function itself.
//   3. Two independent slots in one component -> each slot retains its own
//      initial value, no cross-contamination.
//
// Verified by curl-checking the SSR HTML; client-side updates after a button
// click are out of scope for this fixture (the testbench has no headless
// browser). The hydrate bundle is the place that wires real React, see
// bench/testbench/tests/nextjs-e2e/expect/GET_h01-usestate.expect.
import React from "react";

export default function H01UseStatePage() {
  const [count, setCount] = React.useState(7);
  const [name, setName] = React.useState("World");
  // Lazy initialiser: tracks any regression where SSR returns the FUNCTION
  // value instead of its result.
  const [lazy] = React.useState(() => 21 * 2);
  // Updater-fn no-op invocation: client-side React calls setX with a function
  // when the user wants `prev -> next` semantics. SSR has no re-renders, but
  // the setter must accept any argument shape without throwing during the
  // initial pre-pass (e.g. when a component initialiser eagerly calls set()).
  setCount(function(prev) { return prev + 0; });
  setName(function(prev) { return prev; });
  return (
    <div>
      <h1>H01 useState</h1>
      <p data-testid="count">Count: {count}</p>
      <p data-testid="greet">Hello, {name}!</p>
      <p data-testid="lazy">Lazy: {lazy}</p>
    </div>
  );
}
