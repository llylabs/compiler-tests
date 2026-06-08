async function fetchProducts() {
  return Promise.resolve([
    { id: 1, name: "Widget", price: 10, stock: 100, category: "tools" },
    { id: 2, name: "Gadget", price: 25, stock: 50, category: "electronics" },
    { id: 3, name: "Thingamajig", price: 5, stock: 200, category: "misc" },
  ]);
}

export default async function JsonDataPage() {
  const products = await fetchProducts();
  const totalValue = products.reduce(function(s, p) { return s + p.price * p.stock; }, 0);
  const byCategory = products.reduce(function(acc, p) {
    if (!acc[p.category]) acc[p.category] = 0;
    acc[p.category] = acc[p.category] + 1;
    return acc;
  }, {});
  return (
    <div>
      <h1>Product Inventory</h1>
      <p>Total products: {products.length}</p>
      <p>Total inventory value: ${totalValue}</p>
      <p>Categories: {Object.keys(byCategory).join(", ")}</p>
      <table>
        <thead><tr><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
        <tbody>
          {products.map(function(p) {
            return <tr key={p.id}><td>{p.name}</td><td>{p.price}</td><td>{p.stock}</td></tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
