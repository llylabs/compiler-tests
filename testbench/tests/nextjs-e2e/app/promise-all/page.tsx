// Promise.all + multiple awaits
async function getA() { return Promise.resolve("A"); }
async function getB() { return Promise.resolve("B"); }
async function getC() { return Promise.resolve("C"); }

export default async function PromiseAllPage() {
  var [a, b, c] = await Promise.all([getA(), getB(), getC()]);
  return (
    <div>
      <h1>Promise All</h1>
      <p>Result: {a}-{b}-{c}</p>
    </div>
  );
}
