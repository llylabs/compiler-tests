// About page — project info and tech stack

function TechCard({name, description, icon}) {
  return (
    <div style={{border: '1px solid #eee', borderRadius: 8, padding: 16, flex: 1, minWidth: 200}}>
      <h3 style={{marginTop: 0}}>{icon} {name}</h3>
      <p style={{color: '#666', fontSize: 14, lineHeight: 1.5}}>{description}</p>
    </div>
  );
}

function StatBlock({label, value}) {
  return (
    <div style={{textAlign: 'center', padding: 20}}>
      <div style={{fontSize: 36, fontWeight: 700, color: '#1a1a2e'}}>{value}</div>
      <div style={{color: '#888', fontSize: 14}}>{label}</div>
    </div>
  );
}

export default function AboutPage() {
  var techStack = [
    {name: "NEX Runtime", description: "Universal brick compiler targeting WebAssembly for polyglot execution.", icon: "⚡"},
    {name: "React", description: "Component-based UI library for building interactive user interfaces.", icon: "⚛"},
    {name: "Next.js", description: "The React framework for production with file-based routing and SSR.", icon: "▲"},
    {name: "WebAssembly", description: "Binary instruction format for safe, fast, portable code execution.", icon: "🔧"},
  ];

  return (
    <div>
      <h1>About NEX Blog</h1>
      <p style={{fontSize: 18, lineHeight: 1.6, color: '#555'}}>
        NEX Blog is a demonstration of what is possible when you combine React, Next.js, and
        WebAssembly into a unified runtime. Every page you see is server-side rendered using
        the NEX compiler and runtime — no Node.js required.
      </p>

      <h2>By the numbers</h2>
      <div style={{display: 'flex', gap: 16, marginBottom: 32, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 8}}>
        <StatBlock label="Blog Posts" value="6" />
        <StatBlock label="Authors" value="3" />
        <StatBlock label="Categories" value="4" />
        <StatBlock label="Uptime" value="99.9%" />
      </div>

      <h2>Technology Stack</h2>
      <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32}}>
        {techStack.map(function(tech) {
          return <TechCard key={tech.name} name={tech.name} description={tech.description} icon={tech.icon} />;
        })}
      </div>

      <h2>How it works</h2>
      <ol style={{lineHeight: 2, color: '#555'}}>
        <li>You write React components in TSX/JSX files</li>
        <li>NEX compiles them to BIR (Brick Intermediate Representation)</li>
        <li>BIR is compiled to WebAssembly via the WasmGC backend</li>
        <li>The Wasmtime runtime executes the WASM with host functions for React SSR</li>
        <li>A Rust HTTP server routes requests and serves rendered HTML</li>
      </ol>
    </div>
  );
}
