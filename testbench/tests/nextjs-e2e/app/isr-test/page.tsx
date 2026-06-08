// ISR test — `revalidate = 60` means cache for 60s; test verifies the
// page renders OK. Persistent-cache verification requires multi-process
// scenario; here we just check the rendered output is correct.
export const revalidate = 60;

async function fetchData() {
  return Promise.resolve({ value: "isr-data", ts: "static" });
}

export default async function IsrTestPage() {
  const data = await fetchData();
  return (
    <div>
      <h1>ISR Test</h1>
      <p>Value: {data.value}</p>
      <p>Cache-revalidate: 60s</p>
    </div>
  );
}
