'use client';

import { useOptimistic, useState } from 'react';
import { useFormStatus } from 'react-dom';

function Status() {
  const s = useFormStatus();
  return <span data-testid="form-status">pending: {String(s.pending)}</span>;
}

export default function UseOptimisticPage() {
  const [items] = useState(['alpha', 'beta']);
  const [optimisticItems, addOptimistic] = useOptimistic(items, (state, next) => {
    return [...state, next];
  });
  return (
    <div>
      <h1>useOptimistic</h1>
      <ul data-testid="list">
        {optimisticItems.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
      <p data-testid="count">count: {optimisticItems.length}</p>
      <form>
        <button type="submit"><Status /></button>
      </form>
    </div>
  );
}
