import { unstable_cache } from 'next/cache'

const compute = unstable_cache(
  (x) => {
    globalThis.__memo_calls = (globalThis.__memo_calls || 0) + 1
    return x * 2
  },
  ['memo-test'],
  { tags: ['test-tag'] }
)

export default function Page() {
  globalThis.__memo_calls = 0
  const a = compute(5)
  const b = compute(5)
  const c = compute(5)
  return (
    <div>
      <h1>unstable-cache-memo</h1>
      <p>a={a} b={b} c={c}</p>
      <p>calls={globalThis.__memo_calls}</p>
    </div>
  )
}
