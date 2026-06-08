export default function Blog() {
  var posts = [
    {id: 1, title: "First Post", excerpt: "Hello World"},
    {id: 2, title: "NEX Runtime", excerpt: "WASM-powered JS"},
    {id: 3, title: "React SSR", excerpt: "Server rendering"},
  ];
  return (
    <div>
      <h1>Blog</h1>
      {posts.map(function(post) {
        return (
          <article key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </article>
        );
      })}
    </div>
  );
}
