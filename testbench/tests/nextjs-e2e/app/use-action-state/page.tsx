'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitName } from './act';

const initial = { ok: false, error: null, name: '' };

function SubmitButton() {
  const status = useFormStatus();
  return (
    <button type="submit" disabled={status.pending} data-testid="btn">
      {status.pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

export default function UseActionStatePage() {
  const [state, formAction, isPending] = useActionState(submitName, initial);
  return (
    <div>
      <h1>useActionState</h1>
      <form action={formAction} method="post">
        <input name="name" defaultValue="Ada" />
        <SubmitButton />
      </form>
      <p data-testid="state-ok">ok: {String(state.ok)}</p>
      <p data-testid="state-name">name: {state.name || '(none)'}</p>
      <p data-testid="state-pending">pending: {String(isPending)}</p>
    </div>
  );
}
