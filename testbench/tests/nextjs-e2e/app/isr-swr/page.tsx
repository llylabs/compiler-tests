export const revalidate = 2

export default function Page() {
  // Server time on every render so we can distinguish fresh vs cached vs stale-refreshed
  const stamp = Date.now()
  return (
    <div>
      <h1>isr-swr</h1>
      <p>stamp={stamp}</p>
    </div>
  )
}
