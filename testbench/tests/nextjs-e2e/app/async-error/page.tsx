// Async page with a fetch that rejects — error.tsx boundary catches
async function brokenFetch() {
  return Promise.reject(new Error("upstream down"));
}

export default async function AsyncErrorPage() {
  await brokenFetch();
  return <div>never reached</div>;
}
