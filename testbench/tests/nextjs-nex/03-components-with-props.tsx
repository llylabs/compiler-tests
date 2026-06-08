// @expect-contains: <h1>Dashboard</h1>
// @expect-contains: <span>alice</span>
// @expect-contains: <span>Admin</span>
import React from 'react'

// --- Components (like real Next.js app components) ---
function Header({title}: {title: string}) {
  return <header><h1>{title}</h1></header>;
}

function UserBadge({name, role}: {name: string, role: string}) {
  return (
    <div className="badge">
      <span>{name}</span>
      <span>{role}</span>
    </div>
  );
}

function Sidebar({items}: {items: string[]}) {
  return (
    <nav>
      <ul>
        {items.map(function(item, i) {
          return <li key={i}>{item}</li>;
        })}
      </ul>
    </nav>
  );
}

function Page() {
  return (
    <div>
      <Header title="Dashboard" />
      <UserBadge name="alice" role="Admin" />
      <Sidebar items={["Home", "Settings", "Profile"]} />
    </div>
  );
}

// --- SSR ---
var html = renderToString(<Page />);
if (!html.includes('Dashboard')) throw new Error('Missing Dashboard');
if (!html.includes('alice')) throw new Error('Missing alice');
console.log(html);
