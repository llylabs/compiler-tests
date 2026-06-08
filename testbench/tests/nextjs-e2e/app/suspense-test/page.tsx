import React, { Suspense } from 'react';

function Slow() {
  return <p>Slow component (rendered)</p>;
}

export default function SuspenseTestPage() {
  return (
    <div>
      <h1>Suspense</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <Slow />
      </Suspense>
    </div>
  );
}
