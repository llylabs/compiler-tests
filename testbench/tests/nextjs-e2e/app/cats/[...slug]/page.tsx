// Catch-all route — params.slug is array
export default function CatchAllPage({ params }) {
  const p = params || {};
  const slug = p.slug || [];
  const path = Array.isArray(slug) ? slug.join("/") : String(slug);
  return (
    <div>
      <h1>Catch All</h1>
      <p>Path: {path}</p>
      <p>Depth: {Array.isArray(slug) ? slug.length : 1}</p>
    </div>
  );
}
