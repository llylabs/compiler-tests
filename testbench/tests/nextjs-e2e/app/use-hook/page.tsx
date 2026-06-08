import { use } from 'react';

const cachedPromise = Promise.resolve('hello-from-use');

export default function UseHookPage() {
  const data = use(cachedPromise);
  return (
    <div>
      <h1>Use Hook</h1>
      <p data-testid="value">value: {data}</p>
    </div>
  );
}
