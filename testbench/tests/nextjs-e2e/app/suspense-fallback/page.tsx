import { Suspense } from 'react';

async function SlowChild() {
  // Will return a Promise object that's never awaited — Suspense should
  // detect the thenable in the children subtree and render the fallback.
  await new Promise((r) => setTimeout(r, 1000));
  return <div data-testid="slow">slow content</div>;
}

function Loading() {
  return <p data-testid="fallback">loading...</p>;
}

export default function SuspensePage() {
  return (
    <div>
      <h1>Suspense Test</h1>
      <Suspense fallback={<Loading/>}>
        <SlowChild/>
      </Suspense>
    </div>
  );
}
