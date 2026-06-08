// J-07: await inside switch/case body.
export default async function J07SwitchAwait() {
  async function ident(x) { return x; }
  var key = "b";
  var result = "";
  switch (key) {
    case "a": result = await ident("A"); break;
    case "b": result = await ident("B"); break;
    case "c": result = await ident("C"); break;
    default:  result = "default";
  }
  return <div><h1>j07</h1><p>result={result}</p></div>
}
