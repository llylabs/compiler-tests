// Tests cookies()/headers() from next/headers in a page component
import { cookies, headers } from 'next/headers';

export default function ProfilePage() {
  const c = cookies();
  const h = headers();
  const userAgent = h.get('User-Agent') || 'unknown';
  const session = c.get('session');
  return (
    <div>
      <h1>Profile</h1>
      <p>UA: {userAgent}</p>
      <p>Session: {session ? session.value : 'none'}</p>
    </div>
  );
}
