export default function SpreadArrPage() {
  const a = [1, 2, 3];
  const b = [4, 5];
  const combined = [...a, ...b];
  const withExtra = [0, ...a, 99];
  const copied = [...a];
  copied.push(7);
  return (
    <div>
      <h1>Array Spread</h1>
      <p>Combined: {combined.join(",")}</p>
      <p>WithExtra: {withExtra.join(",")}</p>
      <p>Copied (independent): {copied.join(",")} | original: {a.join(",")}</p>
    </div>
  );
}
