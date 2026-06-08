import { cookies, headers } from 'next/headers';

export default async function Next15ApisPage() {
  const c = await cookies();
  const h = await headers();

  const ua = h.get('user-agent') || 'no-ua';

  return (
    <div>
      <h1>Next 15 Async APIs</h1>
      <p data-testid="ua">ua: {ua.substring(0, 12)}</p>
      <p data-testid="cookies-ok">cookies type: {typeof c.get}</p>
    </div>
  );
}
