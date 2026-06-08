// Sequential await chain with intermediate transformations
async function step1() { return Promise.resolve({ name: "alpha" }); }
async function step2(prev) { return Promise.resolve({ ...prev, count: 5 }); }
async function step3(prev) { return Promise.resolve({ ...prev, double: prev.count * 2 }); }

export default async function ChainPage() {
  var s1 = await step1();
  var s2 = await step2(s1);
  var s3 = await step3(s2);
  return (
    <div>
      <h1>Async Chain</h1>
      <p>Name: {s3.name}</p>
      <p>Count: {s3.count}</p>
      <p>Double: {s3.double}</p>
    </div>
  );
}
