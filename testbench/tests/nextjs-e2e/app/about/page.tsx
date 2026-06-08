export default function About() {
  var features = ["React SSR", "API Routes", "File-based Routing", "Static Files"];
  return (
    <div>
      <h1>About NEX</h1>
      <ul>
        {features.map(function(f, i) {
          return <li key={i}>{f}</li>;
        })}
      </ul>
    </div>
  );
}
