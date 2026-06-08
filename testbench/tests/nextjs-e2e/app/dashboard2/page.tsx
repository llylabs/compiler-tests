import { cookies, headers } from 'next/headers';

async function getStats() {
  return Promise.resolve({ users: 142, revenue: 8650, orders: 27 });
}

async function getRecentActivity() {
  return Promise.resolve([
    { time: "14:32", event: "User registered" },
    { time: "14:18", event: "Order #87 completed" },
    { time: "14:02", event: "Settings updated" },
  ]);
}

export default async function Dashboard2Page() {
  var stats;
  var activity;
  try {
    stats = await getStats();
    activity = await getRecentActivity();
  } catch (e) {
    stats = { users: 0, revenue: 0, orders: 0 };
    activity = [];
  }
  const h = headers();
  return (
    <div>
      <h1>Dashboard</h1>
      <section className="stats">
        <div>Users: {stats.users}</div>
        <div>Revenue: ${stats.revenue}</div>
        <div>Orders: {stats.orders}</div>
      </section>
      <section className="activity">
        <h2>Recent Activity</h2>
        <ul>
          {activity.map(function(a, i) {
            return <li key={i}>{a.time} - {a.event}</li>;
          })}
        </ul>
      </section>
      <footer>Host: {h.get("Host") || "?"}</footer>
    </div>
  );
}
