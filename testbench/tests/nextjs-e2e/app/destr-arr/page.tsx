export default function DestrArrPage() {
  const arr = [1, 2, 3, 4, 5];
  const [first, second, ...rest] = arr;
  const { x, y } = { x: 10, y: 20, z: 30 };
  const { a: renamedA, b: renamedB = 100 } = { a: 5 };
  return (
    <div>
      <h1>Destructuring</h1>
      <p>First: {first}</p>
      <p>Second: {second}</p>
      <p>Rest len: {rest.length}</p>
      <p>X+Y: {x + y}</p>
      <p>RenamedA: {renamedA}</p>
      <p>RenamedB default: {renamedB}</p>
    </div>
  );
}
