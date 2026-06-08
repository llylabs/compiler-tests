export default function MathPage() {
  const sum = 1 + 2 + 3 + 4;
  const product = 2 * 3 * 4;
  const intDiv = 12 / 3;
  const floatDiv = 10 / 4;
  const mod = 17 % 5;
  const maxN = Math.max(1, 5, 3, 7, 2);
  const minN = Math.min(8, 4, 9, 1, 6);
  const sqrt = Math.sqrt(16);
  const abs = Math.abs(-42);
  const pow = Math.pow(2, 8);
  const rounded = Math.round(3.7);
  return (
    <div>
      <h1>Math</h1>
      <p>Sum: {sum}</p>
      <p>Product: {product}</p>
      <p>IntDiv: {intDiv}</p>
      <p>FloatDiv: {floatDiv}</p>
      <p>Mod: {mod}</p>
      <p>Max: {maxN}</p>
      <p>Min: {minN}</p>
      <p>Sqrt: {sqrt}</p>
      <p>Abs: {abs}</p>
      <p>Pow: {pow}</p>
      <p>Rounded: {rounded}</p>
    </div>
  );
}
