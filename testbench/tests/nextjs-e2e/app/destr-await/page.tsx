// Destructuring binding from awaited Promise
async function fetchUser() {
  return Promise.resolve({ name: "Alice", role: "admin", email: "a@x.com" });
}

export default async function DestrAwaitPage() {
  var { name, role } = await fetchUser();
  return (
    <div>
      <h1>Destructured Await</h1>
      <p>Name: {name}</p>
      <p>Role: {role}</p>
    </div>
  );
}
