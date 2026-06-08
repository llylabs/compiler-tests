// J-08: N>1 nested awaits per expression-statement.
export default async function J08NAwaits() {
  async function ident(x) { return x; }
  const sum = (await ident(1)) + (await ident(2)) + (await ident(3));
  return <div><h1>j08</h1><p>sum={sum}</p></div>
}
