// N-04: render the current time so we can prove fetch-cache hits across
// process restarts later. For now: a simple in-process round-trip via a
// long-lived `force-cache` policy fetch.
export default async function Page() {
  const r = await fetch('https://example.com/persist-marker', { cache: 'force-cache' })
  const status = r.status
  return (
    <div>
      <h1>fetch-cache-persist</h1>
      <p>status={status}</p>
    </div>
  )
}
