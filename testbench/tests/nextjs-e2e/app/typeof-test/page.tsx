export default function TypeofPage() {
  const v1 = "hello";
  const v2 = 42;
  const v3 = true;
  const v4 = [1, 2];
  const v5 = { a: 1 };
  const v6 = function() {};
  return (
    <div>
      <h1>Typeof</h1>
      <p>str: {typeof v1}</p>
      <p>num: {typeof v2}</p>
      <p>bool: {typeof v3}</p>
      <p>arr: {typeof v4}</p>
      <p>obj: {typeof v5}</p>
      <p>fn: {typeof v6}</p>
      <p>arr-check: {Array.isArray(v4) ? "yes" : "no"}</p>
    </div>
  );
}
