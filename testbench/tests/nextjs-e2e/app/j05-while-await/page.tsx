// J-05: await inside while-loop body.
export default async function J05WhileAwait() {
  async function ident(x) { return x; }
  var i = 0;
  var sum = 0;
  while (i < 3) {
    const v = await ident(i + 1);
    sum = sum + v;
    i = i + 1;
  }
  return <div><h1>j05</h1><p>sum={sum}</p></div>
}
