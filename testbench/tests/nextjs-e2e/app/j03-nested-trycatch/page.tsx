// J-03 (Stage 1): nested try/catch where outer has await + inner is sync.
// Validates BIR try-region propagation across CPS continuations for the
// non-await-bearing inner case. Full N-level await-bearing nesting deferred
// (depends on J-01-FIX-B / continuation-scope work).
export default async function J03NestedTryCatch() {
  async function ident(x) { return x; }
  var trace = "";
  try {
    trace += "outer-try;";
    const o = await ident("o");
    trace += "o=" + o + ";";
    try {
      trace += "inner-try;";
      throw new Error("inner-boom");
    } catch (e) {
      trace += "inner-catch=" + e.message + ";";
    }
    trace += "outer-after-inner;";
  } catch (e) {
    trace += "outer-catch=" + e.message + ";";
  }
  return <div><h1>j03</h1><p>trace={trace}</p></div>
}
