export default function SpreadPage() {
  const baseAttrs = { className: "card", role: "article" };
  const extra = { "data-id": "42" };
  return (
    <div>
      <h1>Spread</h1>
      <article {...baseAttrs} {...extra}>
        Hello with spread props
      </article>
    </div>
  );
}
