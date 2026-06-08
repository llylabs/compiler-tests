// await inside if-branch (Z3 control-flow path)
async function fetchHi() { return Promise.resolve("hi"); }
async function fetchLo() { return Promise.resolve("lo"); }

export default async function ConditionalPage({ searchParams }) {
  var sp = searchParams || {};
  var msg;
  if (sp.mode === "lo") {
    msg = await fetchLo();
  } else {
    msg = await fetchHi();
  }
  return (
    <div>
      <h1>Conditional</h1>
      <p>Mode: {sp.mode || "default"}</p>
      <p>Msg: {msg}</p>
    </div>
  );
}
