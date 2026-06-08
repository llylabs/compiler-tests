// A complex realistic page: heading, nav, cards, async data, footer
async function fetchStats() {
  return Promise.resolve({ users: 1234, posts: 5678, comments: 9012 });
}

function Card({ title, value, trend }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="value">{value}</p>
      <p className="trend">{trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend) || 0}%</p>
    </div>
  );
}

export const metadata = { title: "Big Component Demo" };

export default async function BigCompPage() {
  const stats = await fetchStats();
  const trends = [5, -2, 0];
  const titles = ["Users", "Posts", "Comments"];
  const values = [stats.users, stats.posts, stats.comments];
  return (
    <div className="dashboard">
      <header>
        <h1>Big Component Demo</h1>
        <nav>
          <a href="/">Home</a> · <a href="/about">About</a>
        </nav>
      </header>
      <main>
        <section className="grid">
          {titles.map(function(t, i) {
            return <Card key={i} title={t} value={values[i]} trend={trends[i]} />;
          })}
        </section>
      </main>
      <footer>Total stats: {Object.keys(stats).length} categories</footer>
    </div>
  );
}
