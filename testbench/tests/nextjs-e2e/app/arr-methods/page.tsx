export default function ArrMethodsPage() {
  const arr = [3, 1, 4, 1, 5, 9, 2, 6];
  const sorted = arr.slice().sort();
  const unique = arr.filter(function(v, i, a) { return a.indexOf(v) === i; });
  const found = arr.find(function(v) { return v > 4; });
  const someBig = arr.some(function(v) { return v > 5; });
  const allPositive = arr.every(function(v) { return v > 0; });
  const sum = arr.reduce(function(s, v) { return s + v; }, 0);
  return (
    <div>
      <h1>Array Methods</h1>
      <p>Sorted: {sorted.join(",")}</p>
      <p>Unique count: {unique.length}</p>
      <p>Found > 4: {found}</p>
      <p>Some > 5: {someBig ? "yes" : "no"}</p>
      <p>All positive: {allPositive ? "yes" : "no"}</p>
      <p>Sum: {sum}</p>
    </div>
  );
}
