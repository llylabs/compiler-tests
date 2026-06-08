// Async page + dynamic route + async generateMetadata + try/catch
async function fetchPost(id) {
  if (id === "missing") {
    return Promise.reject(new Error("not found"));
  }
  return Promise.resolve({ id, title: "Post " + id, body: "Body of post " + id });
}

export async function generateMetadata({ params }) {
  var p = params || {};
  return { title: "Post: " + p.id };
}

export default async function PostPage({ params }) {
  var p = params || {};
  var post;
  try {
    post = await fetchPost(p.id);
  } catch (e) {
    post = { id: p.id, title: "Unknown", body: "Error: " + String(e.message || e) };
  }
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}
