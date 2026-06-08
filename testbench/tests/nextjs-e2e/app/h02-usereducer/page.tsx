"use client";
// H-02 SSR-side fixture: exercises useReducer's three SSR-relevant edge cases.
//   1. 2-arg form: `useReducer(reducer, 5)` -> SSR slot value is 5
//   2. 3-arg form with init fn: `useReducer(reducer, 10, x => x * 2)` -> SSR
//      calls the init fn ONCE with the initialArg, so the slot value is 20
//      (NOT 10 and definitely NOT the function itself).
//   3. dispatch() during SSR pre-pass must be crash-free; SSR has no
//      re-renders so the resulting state is unchanged but the call must not
//      throw — client code commonly fires a dispatch synchronously inside
//      the render body (e.g. data-driven reducers).
//
// Verified by curl-checking the SSR HTML; client-side updates after a button
// click are out of scope for this fixture (the testbench has no headless
// browser). See bench/testbench/tests/nextjs-e2e/expect/GET_h02-usereducer.expect.
import React from "react";

function reducer(state, action) {
  if (action === "+") return state + 1;
  if (action === "-") return state - 1;
  return state;
}

export default function H02UseReducerPage() {
  const [count, dispatch] = React.useReducer(reducer, 5);
  const [doubled] = React.useReducer(reducer, 10, function (x) { return x * 2; });
  // SSR dispatch must be a crash-safe no-op; the count stays 5 in the
  // rendered HTML because there are no re-renders on the server pre-pass.
  dispatch("+");
  dispatch({ type: "noop" });
  return (
    <div>
      <h1>H02 useReducer</h1>
      <p data-testid="count">Count: {count}</p>
      <p data-testid="doubled">Doubled: {doubled}</p>
    </div>
  );
}
