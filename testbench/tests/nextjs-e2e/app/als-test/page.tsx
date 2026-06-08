import { AsyncLocalStorage } from 'node:async_hooks';

const als = new AsyncLocalStorage();

function getInScope() {
  const s = als.getStore();
  return s ? s.requestId + ':' + s.user : 'no-store';
}

export default function AlsPage() {
  const inside = als.run({ requestId: 'req-42', user: 'alice' }, function () {
    return getInScope();
  });
  const outside = als.getStore();
  return (
    <div>
      <h1>AsyncLocalStorage</h1>
      <p data-testid="inside">inside: {inside}</p>
      <p data-testid="outside">outside: {outside === undefined ? 'undefined' : 'defined'}</p>
    </div>
  );
}
