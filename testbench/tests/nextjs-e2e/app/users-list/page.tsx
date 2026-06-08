async function getUsers() {
  return Promise.resolve([
    { id: 1, name: "Alice", role: "admin", lastSeen: "2026-01-01" },
    { id: 2, name: "Bob", role: "user", lastSeen: "2026-01-02" },
    { id: 3, name: "Charlie", role: "user", lastSeen: "2026-01-03" },
  ]);
}

export const metadata = { title: "Users List" };

export default async function UsersListPage() {
  const users = await getUsers();
  return (
    <div>
      <h1>Users</h1>
      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Role</th><th>Last seen</th></tr>
        </thead>
        <tbody>
          {users.map(function(u) {
            return (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td>{u.lastSeen}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>Total: {users.length}</p>
    </div>
  );
}
