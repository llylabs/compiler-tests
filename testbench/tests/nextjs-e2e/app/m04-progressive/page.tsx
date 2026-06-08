// M-04: progressive enhancement — server action via <form action={...}>
// renders form with /_lly/action/... action URL so a JS-disabled browser
// can submit it natively.
async function noop() {
  'use server'
}

export default function Page() {
  return (
    <div>
      <h1>m04-progressive</h1>
      <form action={noop} method="post">
        <button type="submit">submit</button>
      </form>
    </div>
  )
}
