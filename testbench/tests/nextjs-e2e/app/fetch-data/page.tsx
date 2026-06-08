export default async function FetchDataPage() {
  // Use try/catch around an await (was Z5-broken)
  var result;
  try {
    result = await Promise.resolve({ users: 42, items: 99 });
  } catch (e) {
    result = { users: 0, items: 0, error: String(e) };
  }
  return (
    <div>
      <h1>Fetch Data</h1>
      <p>Users: {result.users}</p>
      <p>Items: {result.items}</p>
    </div>
  );
}
