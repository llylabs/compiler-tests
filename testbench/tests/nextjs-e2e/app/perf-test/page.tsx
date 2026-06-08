// Render a large list (100 items) to verify performance + correctness at scale
export default function PerfTestPage() {
  const items = [];
  for (var i = 0; i < 100; i++) {
    items.push({ id: i, label: "Item " + i });
  }
  return (
    <div>
      <h1>Perf Test</h1>
      <p>Rendered {items.length} items</p>
      <ul>
        {items.map(function(it) {
          return <li key={it.id}>{it.label}</li>;
        })}
      </ul>
    </div>
  );
}
