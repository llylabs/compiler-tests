// J-04: `await pendingP` inside try/catch returns resolved value (not Promise).
// Historic Z5 gap test.
export default async function J04AwaitPending() {
  const pendingP = Promise.resolve("the-value");
  var result;
  try {
    result = await pendingP;
  } catch (e) {
    result = "ERR:" + e.message;
  }
  return <div><h1>j04</h1><p>result={result}</p></div>
}
