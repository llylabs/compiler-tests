export default function PostDetail({params}) {
  var slug = params && params.slug ? params.slug : "unknown";
  return (
    <div>
      <h1>Post: {slug}</h1>
      <p>This page shows a specific blog post.</p>
      <a href="/blog">Back to all posts</a>
    </div>
  );
}
