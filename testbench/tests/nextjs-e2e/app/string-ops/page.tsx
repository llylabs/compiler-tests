export default function StringOpsPage() {
  const s = "Hello World";
  const upper = s.toUpperCase();
  const lower = s.toLowerCase();
  const sliced = s.slice(0, 5);
  const replaced = s.replace("World", "Universe");
  const parts = s.split(" ");
  return (
    <div>
      <h1>String Ops</h1>
      <p>Upper: {upper}</p>
      <p>Lower: {lower}</p>
      <p>Sliced: {sliced}</p>
      <p>Replaced: {replaced}</p>
      <p>Parts: {parts.length}</p>
      <p>Concat: {s + "!"}</p>
      <p>Length: {s.length}</p>
    </div>
  );
}
