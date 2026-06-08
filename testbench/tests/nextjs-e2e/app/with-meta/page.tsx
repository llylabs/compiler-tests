// Tests dynamic generateMetadata sync function with params
export function generateMetadata({ params, searchParams }) {
  const sp = searchParams || {};
  return {
    title: "Custom-" + (sp.q || "default"),
    description: "Dynamic metadata page",
  };
}

export default function MetaPage({ searchParams }) {
  const sp = searchParams || {};
  return (
    <div>
      <h1>With Meta</h1>
      <p>Query: {sp.q || 'none'}</p>
    </div>
  );
}
