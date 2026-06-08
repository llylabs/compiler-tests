export default function JsonRenderPage() {
  const data = {
    user: { name: "Alice", age: 30 },
    items: [1, 2, 3, 4, 5],
    flags: { admin: true, beta: false },
  };
  return (
    <div>
      <h1>JSON Render</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <p>Items length: {data.items.length}</p>
    </div>
  );
}
