// Tests N awaits in sequence (multi-await CPS chain)
async function step(n) {
  return Promise.resolve(n * 2);
}

export default async function MultiAwaitPage() {
  var a = await step(1);
  var b = await step(2);
  var c = await step(3);
  var d = await step(4);
  return (
    <div>
      <h1>Multi Await</h1>
      <p>a={a} b={b} c={c} d={d} sum={a + b + c + d}</p>
    </div>
  );
}
