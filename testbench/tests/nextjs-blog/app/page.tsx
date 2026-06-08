// Home page — shows hero section, recent posts, and sidebar

var posts = [
  {id: 1, title: "Getting Started with NEX Runtime", slug: "getting-started-nex", excerpt: "Learn how to build and run JavaScript applications on the NEX universal runtime.", author: "Alice Chen", date: "2024-03-15", tags: ["nex", "wasm", "tutorial"], readTime: 5},
  {id: 2, title: "React SSR on WebAssembly", slug: "react-ssr-wasm", excerpt: "How NEX enables server-side rendering of React components through WebAssembly.", author: "Alice Chen", date: "2024-03-20", tags: ["react", "ssr"], readTime: 8},
  {id: 3, title: "Building API Routes with Next.js on NEX", slug: "api-routes-nextjs", excerpt: "Create REST APIs using Next.js App Router conventions powered by the NEX runtime.", author: "Bob Martinez", date: "2024-03-25", tags: ["nextjs", "api"], readTime: 6},
];

var categories = [
  {name: "Tutorials", count: 2},
  {name: "Architecture", count: 2},
  {name: "DevOps", count: 1},
  {name: "Frontend", count: 1},
];

function PostCard({post}) {
  return (
    <article style={{borderBottom: '1px solid #eee', paddingBottom: 20, marginBottom: 20}}>
      <h2 style={{margin: '0 0 8px'}}><a href={"/blog/" + post.slug} style={{color: '#1a1a2e'}}>{post.title}</a></h2>
      <div style={{color: '#888', fontSize: 14, marginBottom: 8}}>
        <span>By {post.author}</span>
        <span> &middot; </span>
        <span>{post.date}</span>
        <span> &middot; </span>
        <span>{post.readTime} min read</span>
      </div>
      <p style={{color: '#555', lineHeight: 1.6}}>{post.excerpt}</p>
      <div style={{display: 'flex', gap: 8}}>
        {post.tags.map(function(tag) {
          return <span key={tag} style={{backgroundColor: '#e8f4fd', color: '#0066cc', padding: '2px 8px', borderRadius: 4, fontSize: 12}}>{tag}</span>;
        })}
      </div>
    </article>
  );
}

function Sidebar() {
  return (
    <aside style={{width: 280}}>
      <div style={{backgroundColor: '#f8f9fa', padding: 20, borderRadius: 8, marginBottom: 20}}>
        <h3 style={{marginTop: 0}}>About this blog</h3>
        <p style={{color: '#666', fontSize: 14, lineHeight: 1.5}}>
          Exploring the future of web development with NEX, WebAssembly, and modern JavaScript frameworks.
        </p>
      </div>
      <div style={{backgroundColor: '#f8f9fa', padding: 20, borderRadius: 8}}>
        <h3 style={{marginTop: 0}}>Categories</h3>
        <ul style={{listStyle: 'none', padding: 0}}>
          {categories.map(function(cat) {
            return (
              <li key={cat.name} style={{padding: '6px 0', borderBottom: '1px solid #eee'}}>
                <span>{cat.name}</span>
                <span style={{color: '#888', marginLeft: 8}}>({cat.count})</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

export default function Home() {
  return (
    <div>
      <section style={{backgroundColor: '#1a1a2e', color: 'white', padding: 40, borderRadius: 12, marginBottom: 32, textAlign: 'center'}}>
        <h1 style={{fontSize: 36, marginBottom: 12}}>Welcome to NEX Blog</h1>
        <p style={{fontSize: 18, color: '#ccc', maxWidth: 600, margin: '0 auto'}}>
          Insights on WebAssembly, React, Next.js, and the future of web development — all powered by the NEX runtime.
        </p>
      </section>
      <div style={{display: 'flex', gap: 32}}>
        <div style={{flex: 1}}>
          <h2>Recent Posts</h2>
          {posts.map(function(post) {
            return <PostCard key={post.id} post={post} />;
          })}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
