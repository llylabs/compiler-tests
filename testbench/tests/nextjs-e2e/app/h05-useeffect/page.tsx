"use client";
// H-05 SSR-side fixture: exercises useEffect + useLayoutEffect.
//   1. useEffect callbacks NEVER run on the server — they are scheduled for
//      after-mount on the client only.  The SSR stub must therefore be a
//      crash-free no-op regardless of what callback / deps array is passed.
//   2. useLayoutEffect has identical SSR semantics (React itself even logs a
//      warning when it sees a layout-effect during SSR).  Our stub silently
//      no-ops to keep the page rendering.
//   3. Both hooks must be callable with 1-arg, 2-arg (with deps array), and
//      with a callback that returns a cleanup function — none of those shapes
//      may trigger a "useEffect is not a function" or any other throw.
//
// Verified by curl-checking the SSR HTML; client-side effect execution is
// out of scope for this fixture (the testbench has no headless browser).
import React from "react";

export default function H05UseEffectPage() {
  // 1-arg useEffect with no deps: callback would run after every render on
  // the client.  On SSR it must be skipped silently.
  React.useEffect(function() {
    // Body intentionally references a non-existent symbol to prove the
    // callback is NOT invoked on the server — if it were, this would throw
    // ReferenceError and break SSR.
    // eslint-disable-next-line no-undef
    console.log(THIS_WOULD_THROW_IF_INVOKED);
  });

  // 2-arg useEffect with empty deps array: "run once on mount" pattern.
  React.useEffect(function() {
    return function cleanup() { /* would unsubscribe on unmount */ };
  }, []);

  // useLayoutEffect: same SSR semantics as useEffect — must be a no-op.
  React.useLayoutEffect(function() {
    // Returning a cleanup must not throw on the server either.
    return function() {};
  }, [1, 2, 3]);

  return (
    <div>
      <h1>H05 useEffect</h1>
      <p data-testid="status">EffectStub OK</p>
    </div>
  );
}
