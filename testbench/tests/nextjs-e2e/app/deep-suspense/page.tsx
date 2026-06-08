import { Suspense } from 'react';

async function fetchUser(id) {
  return { id, name: 'user-' + id };
}

async function fetchPosts(userId) {
  return ['post-' + userId + '-a', 'post-' + userId + '-b'];
}

async function UserHeader({ id }) {
  const u = await fetchUser(id);
  return <h2 data-testid="user-name">user: {u.name}</h2>;
}

async function PostList({ userId }) {
  const posts = await fetchPosts(userId);
  return (
    <ul data-testid="posts">
      {posts.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}

async function UserProfile({ id }) {
  return (
    <section data-testid="profile">
      <Suspense fallback={<p>loading header…</p>}>
        <UserHeader id={id} />
      </Suspense>
      <Suspense fallback={<p>loading posts…</p>}>
        <PostList userId={id} />
      </Suspense>
    </section>
  );
}

export default async function DeepSuspensePage() {
  return (
    <div>
      <h1>Deep Suspense</h1>
      <Suspense fallback={<p>loading profile…</p>}>
        <UserProfile id={42} />
      </Suspense>
    </div>
  );
}
