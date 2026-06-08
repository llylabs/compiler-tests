// Shared data layer — simulates a database
// Used by both pages (SSR) and API routes

var authors = [
  {
    id: 1,
    name: "Alice Chen",
    slug: "alice",
    bio: "Full-stack developer and open source enthusiast. Loves Rust and WebAssembly.",
    avatar: "/avatars/alice.jpg",
    role: "Admin",
    postCount: 3,
  },
  {
    id: 2,
    name: "Bob Martinez",
    slug: "bob",
    bio: "DevOps engineer focused on cloud-native infrastructure and CI/CD pipelines.",
    avatar: "/avatars/bob.jpg",
    role: "Editor",
    postCount: 2,
  },
  {
    id: 3,
    name: "Carol Kim",
    slug: "carol",
    bio: "Frontend architect specializing in React, Next.js and design systems.",
    avatar: "/avatars/carol.jpg",
    role: "Author",
    postCount: 1,
  },
];

var posts = [
  {
    id: 1,
    title: "Getting Started with NEX Runtime",
    slug: "getting-started-nex",
    excerpt: "Learn how to build and run JavaScript applications on the NEX universal runtime.",
    body: "NEX is a polyglot compiler system that compiles JavaScript, TypeScript, C, C++ and Python into a common WASM format called Bricks. This post covers the basics of getting started.",
    authorId: 1,
    date: "2024-03-15",
    tags: ["nex", "wasm", "tutorial"],
    readTime: 5,
  },
  {
    id: 2,
    title: "React SSR on WebAssembly",
    slug: "react-ssr-wasm",
    excerpt: "How NEX enables server-side rendering of React components through WebAssembly.",
    body: "Server-side rendering with React traditionally requires Node.js. With NEX, we compile React components to WASM and render them using our hyperscript runtime. This enables React SSR without Node.js.",
    authorId: 1,
    date: "2024-03-20",
    tags: ["react", "ssr", "wasm"],
    readTime: 8,
  },
  {
    id: 3,
    title: "Building API Routes with Next.js on NEX",
    slug: "api-routes-nextjs",
    excerpt: "Create REST APIs using Next.js App Router conventions powered by the NEX runtime.",
    body: "Next.js API routes allow you to build your backend alongside your frontend. With NEX, these routes are compiled to WASM and served by a lightweight Rust HTTP server.",
    authorId: 2,
    date: "2024-03-25",
    tags: ["nextjs", "api", "backend"],
    readTime: 6,
  },
  {
    id: 4,
    title: "The Future of Edge Computing with WASM",
    slug: "future-edge-wasm",
    excerpt: "Why WebAssembly is becoming the standard for edge computing and serverless functions.",
    body: "Edge computing is evolving rapidly. WebAssembly provides a sandboxed, portable execution environment that is ideal for running code at the edge. NEX brings this vision to reality.",
    authorId: 1,
    date: "2024-04-01",
    tags: ["wasm", "edge", "cloud"],
    readTime: 10,
  },
  {
    id: 5,
    title: "DevOps Best Practices for WASM Deployments",
    slug: "devops-wasm",
    excerpt: "Operational patterns for deploying and monitoring WebAssembly workloads in production.",
    body: "Deploying WASM applications requires new operational patterns. This post covers monitoring, logging, scaling, and CI/CD integration for NEX-based applications.",
    authorId: 2,
    date: "2024-04-05",
    tags: ["devops", "wasm", "production"],
    readTime: 7,
  },
  {
    id: 6,
    title: "Design Systems with React and NEX",
    slug: "design-systems-react",
    excerpt: "Building a component library that renders identically in Node.js and NEX runtime.",
    body: "A well-designed component library should be runtime-agnostic. We explore how to build React components that work seamlessly across Node.js and NEX environments.",
    authorId: 3,
    date: "2024-04-10",
    tags: ["react", "design", "components"],
    readTime: 9,
  },
];

var categories = [
  {name: "Tutorials", count: 2, slug: "tutorials"},
  {name: "Architecture", count: 2, slug: "architecture"},
  {name: "DevOps", count: 1, slug: "devops"},
  {name: "Frontend", count: 1, slug: "frontend"},
];

function getAuthorById(id) {
  for (var i = 0; i < authors.length; i++) {
    if (authors[i].id === id) return authors[i];
  }
  return null;
}

function getPostsByAuthorId(authorId) {
  var result = [];
  for (var i = 0; i < posts.length; i++) {
    if (posts[i].authorId === authorId) result.push(posts[i]);
  }
  return result;
}

function getRecentPosts(count) {
  return posts.slice(0, count);
}
