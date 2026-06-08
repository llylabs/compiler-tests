export default function ArrowFnPage() {
  const double = x => x * 2;
  const add = (a, b) => a + b;
  const greet = name => "Hi " + name;
  const items = [1, 2, 3].map(x => x * 10);
  return (
    <div>
      <h1>Arrow Fns</h1>
      <p>Double 5: {double(5)}</p>
      <p>Add 3+4: {add(3, 4)}</p>
      <p>Greet: {greet("Alice")}</p>
      <p>Items: {items.join(",")}</p>
    </div>
  );
}
