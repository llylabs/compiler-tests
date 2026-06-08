// Verifies I-02 boundary marker emission: <Suspense> wraps children in a
// <div data-lly-hydrate-boundary="B:N"> element that the I-03 streaming
// runtime (window.__lly_replace) can target for in-place swap.
import { Suspense } from 'react'

export default function I02SuspenseMarker() {
  return (
    <div>
      <h1>I-02 Suspense Marker</h1>
      <Suspense fallback={<p>loading fallback</p>}>
        <div>resolved content inside suspense</div>
      </Suspense>
    </div>
  )
}
