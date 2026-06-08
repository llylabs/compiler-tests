export const metadata = {
  title: "Item Detail",
};

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

export default function ItemPage({ params, searchParams }) {
  const p = params || {};
  const sp = searchParams || {};
  return (
    <div>
      <h1>Item {p.id}</h1>
      <p>Static: {p.id}</p>
      <p>Query mode: {sp.mode || "default"}</p>
    </div>
  );
}
