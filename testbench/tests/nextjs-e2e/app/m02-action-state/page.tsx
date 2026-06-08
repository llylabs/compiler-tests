// M-02: useActionState replays its action's return value through a one-shot
// cookie roundtrip.  This SSR fixture only verifies that the page renders the
// initial state and the lowered form action URL.  The cookie-roundtrip itself
// is exercised by m02-action-state-after via expect contains markers.

import { useActionState } from 'react'

async function submit(prevState, formData) {
  'use server'
  return { count: ((prevState && prevState.count) || 0) + 1 }
}

export default function Page() {
  const [state, formAction] = useActionState(submit, { count: 0 })
  return (
    <div>
      <h1>m02</h1>
      <p>count={state.count}</p>
      <form action={formAction} method="post">
        <button type="submit">go</button>
      </form>
    </div>
  )
}
