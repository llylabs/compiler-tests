export default function Dashboard() {
  var stats = [
    {label: "Users", value: 1234, change: "+12%"},
    {label: "Revenue", value: 56789, change: "+8%"},
    {label: "Orders", value: 432, change: "-3%"},
  ];

  var recentOrders = [
    {id: "ORD-001", customer: "Alice", amount: 99, status: "completed"},
    {id: "ORD-002", customer: "Bob", amount: 149, status: "pending"},
    {id: "ORD-003", customer: "Charlie", amount: 79, status: "shipped"},
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats-grid">
        {stats.map(function(stat) {
          return (
            <div key={stat.label} className="stat-card">
              <h3>{stat.label}</h3>
              <p className="stat-value">{stat.value}</p>
              <span className={stat.change.indexOf("+") === 0 ? "positive" : "negative"}>{stat.change}</span>
            </div>
          );
        })}
      </div>
      <h2>Recent Orders</h2>
      <table>
        <thead>
          <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
        </thead>
        <tbody>
          {recentOrders.map(function(order) {
            return (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer}</td>
                <td>${order.amount}</td>
                <td>{order.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
