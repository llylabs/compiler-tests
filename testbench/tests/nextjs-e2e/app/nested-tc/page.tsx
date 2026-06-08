// Nested try/catch with awaits at different levels
async function outer() { return Promise.resolve("outer-ok"); }
async function inner() { return Promise.resolve("inner-ok"); }

export default async function NestedTcPage() {
  var a;
  try {
    a = await outer();
    try {
      var b = await inner();
      a = a + "+" + b;
    } catch (ie) {
      a = a + "+inner-err";
    }
  } catch (oe) {
    a = "outer-err";
  }
  return (
    <div>
      <h1>Nested TC</h1>
      <p>Result: {a}</p>
    </div>
  );
}
