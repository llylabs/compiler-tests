import { Suspense, use } from 'react';

// Pending promise — never resolves in the request lifetime.
const pendingP = new Promise(() => {});

function PendingComp() {
  const data = use(pendingP);
  return <p data-testid="pending">data: {String(data)}</p>;
}

function ResolvedComp() {
  const data = use(Promise.resolve('R-DATA'));
  return <p data-testid="resolved">data: {data}</p>;
}

export default function UsePendingPage() {
  return (
    <div>
      <h1>use() pending vs resolved</h1>
      <ResolvedComp />
      <Suspense fallback={<p data-testid="fallback">FALLBACK</p>}>
        <PendingComp />
      </Suspense>
    </div>
  );
}
