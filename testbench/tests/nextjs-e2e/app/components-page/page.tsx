// Multiple components defined in one file (common pattern)
function Header({ title, subtitle }) {
  return (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Footer({ year }) {
  return <footer>© {year} Example Co</footer>;
}

export default function ComponentsPage() {
  return (
    <div>
      <Header title="Multi-Components" subtitle="Demo page" />
      <Card title="Card A">
        <p>Content A</p>
        <p>More A</p>
      </Card>
      <Card title="Card B">
        <p>Content B</p>
      </Card>
      <Footer year={2026} />
    </div>
  );
}
