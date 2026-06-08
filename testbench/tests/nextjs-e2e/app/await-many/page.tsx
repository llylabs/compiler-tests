// 6 awaits with mixed patterns
async function step(n) { return Promise.resolve(n * 10); }

export default async function AwaitManyPage() {
  var a = await step(1);
  var b = await step(2);
  var sum1 = a + b;
  var c;
  c = await step(3);
  try {
    var d = await step(4);
    sum1 = sum1 + c + d;
  } catch (e) {}
  var e = await step(5);
  var f = await step(6);
  var total = sum1 + e + f;
  return (
    <div>
      <h1>Await Many</h1>
      <p>Total: {total}</p>
      <p>Components: a={a},b={b},c={c},e={e},f={f}</p>
    </div>
  );
}
