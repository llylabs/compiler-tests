async function fetchData() {
  return Promise.resolve({ items: ["alpha", "beta", "gamma"] });
}

export default async function AsyncPage() {
  var data = await fetchData();
  return (
    <div>
      <h1>Async Page</h1>
      <ul>
        {data.items.map(function(item, i) { return <li key={i}>{item}</li>; })}
      </ul>
    </div>
  );
}
