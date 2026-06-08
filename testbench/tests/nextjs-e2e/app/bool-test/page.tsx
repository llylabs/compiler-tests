// Booleans + null/undefined render nothing (React semantics)
export default function BoolPage({ searchParams }) {
  const sp = searchParams || {};
  const show = sp.show === "yes";
  return (
    <div>
      <h1>Bool Test</h1>
      {show && <p>Visible</p>}
      {!show && <p>Hidden default</p>}
      {true}
      {false}
      {null}
      {undefined}
      <span>End</span>
    </div>
  );
}
