import { cookies } from 'next/headers'

export const revalidate = 10

export default function Page() {
  // Non-sensitive cookie — should be cached + replayed
  cookies().set('locale', 'en')
  // Sensitive (matches "session") — should be SCRUBBED at PUT time
  cookies().set('session', 'secret-token-123')
  return (
    <div>
      <h1>isr-cookies</h1>
      <p>ISR=10s</p>
    </div>
  )
}
