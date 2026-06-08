export default function AdminLayout({children}) {
  return (
    <div>
      <nav><a href="/admin/users">Users</a></nav>
      <main>{children}</main>
    </div>
  );
}
