export default function ObjMethodsPage() {
  const data = { a: 1, b: 2, c: 3 };
  const keys = Object.keys(data);
  const values = Object.values(data);
  const entries = Object.entries(data);
  return (
    <div>
      <h1>Object Methods</h1>
      <p>Keys: {keys.join(",")}</p>
      <p>Values: {values.join(",")}</p>
      <p>Entries count: {entries.length}</p>
      <p>Has 'a': {data.hasOwnProperty("a") ? "yes" : "no"}</p>
    </div>
  );
}
