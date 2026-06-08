import { Suspense } from 'react';

async function fetchTitle() {
  return 'Async Server Component Title';
}

async function AsyncTitle() {
  const t = await fetchTitle();
  return <h2 data-testid="async-title">{t}</h2>;
}

function Loading() {
  return <p data-testid="async-loading">loading…</p>;
}

export default async function AsyncSuspensePage() {
  return (
    <div>
      <h1>Async + Suspense</h1>
      <Suspense fallback={<Loading/>}>
        <AsyncTitle/>
      </Suspense>
    </div>
  );
}
