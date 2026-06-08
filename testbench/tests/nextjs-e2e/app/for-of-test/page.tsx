export default function ForOfPage() {
  const items = [10, 20, 30, 40];
  var sum = 0;
  for (var v of items) {
    sum = sum + v;
  }
  var labels = [];
  for (var [idx, val] of items.map(function(v, i) { return [i, v]; })) {
    labels.push("[" + idx + "]=" + val);
  }
  return (
    <div>
      <h1>For-Of</h1>
      <p>Sum: {sum}</p>
      <p>Labels: {labels.join(" ")}</p>
    </div>
  );
}
