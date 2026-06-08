export default function SpArrayPage({ searchParams }) {
  var sp = searchParams || {};
  // searchParams in App Router can be string OR string[] for repeated keys.
  var tags = sp.tag;
  var tagList = Array.isArray(tags) ? tags.join(",") : (tags || "(none)");
  return (
    <div>
      <h1>SP Array</h1>
      <p>Tags: {tagList}</p>
      <p>Page: {sp.page || "1"}</p>
    </div>
  );
}
