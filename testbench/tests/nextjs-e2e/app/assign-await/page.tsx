// Bare assignment-await ExpressionStatement at top level (no try/catch).
// Was Z5-broken: ExpressionStatement-await scheduler only handled void awaits.
async function fetchVal() { return Promise.resolve({ x: 5 }); }

export default async function AssignAwaitPage() {
  var data;
  data = await fetchVal();
  data.x = data.x + 100;
  return (
    <div>
      <h1>Assign Await</h1>
      <p>Got: {data.x}</p>
    </div>
  );
}
