"use client";
// H-06 SSR-side fixture: exercises useMemo + useCallback.
//   1. `useMemo(fn, deps)` invokes fn() once during SSR and returns the
//      result. With deps=[] the memoised value is the literal computation
//      output — here 7*6 must render as 42.
//   2. `useCallback(fn, deps)` returns the function identity itself on SSR.
//      Calling the returned reference must execute the original function and
//      produce its result so we can confirm the stub didn't swallow it.
import React from "react";

export default function H06UseMemoPage() {
  // useMemo: compute 7*6 lazily; SSR stub must run the factory and return 42.
  const memoVal = React.useMemo(() => 7 * 6, []);
  // useCallback: returns the fn itself; invoking it must yield "CB OK".
  const cb = React.useCallback(() => "CB OK", []);
  const cbResult = cb();

  return (
    <div>
      <h1>H06 useMemo / useCallback</h1>
      <p data-testid="memo">Memo: {memoVal}</p>
      <p data-testid="cb">{cbResult}</p>
    </div>
  );
}
