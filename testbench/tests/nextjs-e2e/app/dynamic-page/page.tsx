export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dynamic Page",
  description: "Forced dynamic rendering",
};

export default function DynamicPage({ searchParams }) {
  const sp = searchParams || {};
  return (
    <div>
      <h1>Dynamic</h1>
      <p>Title: {sp.q || "no query"}</p>
      <p>Sort: {sp.sort || "asc"}</p>
    </div>
  );
}
