export default function MapRenderPage() {
  const items = [
    { id: 1, name: "Apple", price: 1 },
    { id: 2, name: "Banana", price: 2 },
    { id: 3, name: "Cherry", price: 3 },
  ];
  const total = items.reduce(function(s, i) { return s + i.price; }, 0);
  const filtered = items.filter(function(i) { return i.price > 1; });
  return (
    <div>
      <h1>Map Render</h1>
      <ul>
        {items.map(function(it) {
          return <li key={it.id}>{it.name}: ${it.price}</li>;
        })}
      </ul>
      <p>Filtered count: {filtered.length}</p>
      <p>Total: {total}</p>
    </div>
  );
}
