export async function generateMetadata({ searchParams }) {
  var val = await Promise.resolve(searchParams && searchParams.q ? searchParams.q : "default");
  return { title: "Async-" + val, description: "Async generateMetadata" };
}

export default function AsyncMetaPage({ searchParams }) {
  const sp = searchParams || {};
  return (
    <div>
      <h1>Async Meta</h1>
      <p>Q={sp.q || "none"}</p>
    </div>
  );
}
