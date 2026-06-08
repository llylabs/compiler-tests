import { Suspense } from 'react';

function ResolvedChild() {
  return <div data-testid="resolved">resolved content</div>;
}

function Loading() {
  return <p data-testid="fallback">loading...</p>;
}

export default function SuspenseSyncPage() {
  return (
    <div>
      <h1>Suspense Sync</h1>
      <Suspense fallback={<Loading/>}>
        <ResolvedChild/>
      </Suspense>
    </div>
  );
}
