import { NextResponse } from 'next/server'

export function GET() {
  var posts = [
    {id: 1, title: "Getting Started with NEX Runtime", author: "Alice Chen", date: "2024-03-15", tags: ["nex", "wasm"]},
    {id: 2, title: "React SSR on WebAssembly", author: "Alice Chen", date: "2024-03-20", tags: ["react", "ssr"]},
    {id: 3, title: "Building API Routes with Next.js on NEX", author: "Bob Martinez", date: "2024-03-25", tags: ["nextjs", "api"]},
    {id: 4, title: "The Future of Edge Computing with WASM", author: "Alice Chen", date: "2024-04-01", tags: ["wasm", "edge"]},
    {id: 5, title: "DevOps Best Practices for WASM Deployments", author: "Bob Martinez", date: "2024-04-05", tags: ["devops"]},
    {id: 6, title: "Design Systems with React and NEX", author: "Carol Kim", date: "2024-04-10", tags: ["react", "design"]},
  ];
  return NextResponse.json({ posts: posts, total: posts.length });
}
