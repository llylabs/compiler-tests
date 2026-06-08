// Ternary and nested conditional rendering
export default function CondPage({ searchParams }) {
  const sp = searchParams || {};
  const level = parseInt(sp.level || "0", 10) || 0;
  return (
    <div>
      <h1>Conditional 2</h1>
      <p>Level: {level}</p>
      <p>{level > 5 ? "high" : level > 0 ? "medium" : "low"}</p>
      <ul>
        {level >= 1 && <li>Item 1</li>}
        {level >= 2 && <li>Item 2</li>}
        {level >= 3 && <li>Item 3</li>}
      </ul>
      {level === 0 && (
        <div>
          <p>Empty level — default content</p>
        </div>
      )}
    </div>
  );
}
