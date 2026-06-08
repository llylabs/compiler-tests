// Set in one module-level statement
globalThis.__lly_test_shared = { count: 0, marker: 'set-once' };

function reader() {
  return globalThis.__lly_test_shared;
}

export default function SharedGlobalPage() {
  globalThis.__lly_test_shared.count = globalThis.__lly_test_shared.count + 1;
  const s = reader();
  return (
    <div>
      <h1>Shared GlobalThis</h1>
      <p data-testid="marker">marker: {s.marker}</p>
      <p data-testid="count">count: {s.count}</p>
    </div>
  );
}
