// Blog listing page — all posts with filtering by tag

var allPosts = [
  {id: 1, title: "Getting Started with NEX Runtime", excerpt: "Learn how to build and run JavaScript applications on the NEX universal runtime.", author: "Alice Chen", date: "2024-03-15", tags: ["nex", "wasm", "tutorial"], readTime: 5},
  {id: 2, title: "React SSR on WebAssembly", excerpt: "How NEX enables server-side rendering of React components through WebAssembly.", author: "Alice Chen", date: "2024-03-20", tags: ["react", "ssr", "wasm"], readTime: 8},
  {id: 3, title: "Building API Routes with Next.js on NEX", excerpt: "Create REST APIs using Next.js App Router conventions powered by the NEX runtime.", author: "Bob Martinez", date: "2024-03-25", tags: ["nextjs", "api", "backend"], readTime: 6},
  {id: 4, title: "The Future of Edge Computing with WASM", excerpt: "Why WebAssembly is becoming the standard for edge computing and serverless functions.", author: "Alice Chen", date: "2024-04-01", tags: ["wasm", "edge", "cloud"], readTime: 10},
  {id: 5, title: "DevOps Best Practices for WASM Deployments", excerpt: "Operational patterns for deploying and monitoring WebAssembly workloads in production.", author: "Bob Martinez", date: "2024-04-05", tags: ["devops", "wasm", "production"], readTime: 7},
  {id: 6, title: "Design Systems with React and NEX", excerpt: "Building a component library that renders identically in Node.js and NEX runtime.", author: "Carol Kim", date: "2024-04-10", tags: ["react", "design", "components"], readTime: 9},
];

function TagBadge({tag}) {
  return <span style={{backgroundColor: '#e8f4fd', color: '#0066cc', padding: '2px 8px', borderRadius: 4, fontSize: 12, marginRight: 4}}>{tag}</span>;
}

function BlogPostRow({post}) {
  return (
    <tr>
      <td style={{padding: '12px 0', borderBottom: '1px solid #eee'}}>
        <a href={"/blog/" + post.id} style={{color: '#1a1a2e', fontWeight: 600}}>{post.title}</a>
        <p style={{color: '#666', fontSize: 14, margin: '4px 0'}}>{post.excerpt}</p>
      </td>
      <td style={{padding: '12px 8px', borderBottom: '1px solid #eee', color: '#888', whiteSpace: 'nowrap'}}>{post.author}</td>
      <td style={{padding: '12px 8px', borderBottom: '1px solid #eee', color: '#888', whiteSpace: 'nowrap'}}>{post.date}</td>
      <td style={{padding: '12px 0', borderBottom: '1px solid #eee'}}>
        {post.tags.map(function(t) { return <TagBadge key={t} tag={t} />; })}
      </td>
    </tr>
  );
}

export default function BlogPage() {
  return (
    <div>
      <h1>All Blog Posts</h1>
      <p style={{color: '#666'}}>{allPosts.length} articles about web development, WebAssembly, and more.</p>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr style={{textAlign: 'left', borderBottom: '2px solid #333'}}>
            <th style={{padding: '8px 0'}}>Title</th>
            <th style={{padding: '8px'}}>Author</th>
            <th style={{padding: '8px'}}>Date</th>
            <th style={{padding: '8px 0'}}>Tags</th>
          </tr>
        </thead>
        <tbody>
          {allPosts.map(function(post) {
            return <BlogPostRow key={post.id} post={post} />;
          })}
        </tbody>
      </table>
    </div>
  );
}
