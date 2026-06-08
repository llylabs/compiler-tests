export default function TemplateLitPage() {
  const name = "World";
  const greeting = `Hello, ${name}!`;
  const len = name.length;
  const info = `${name} is ${len} chars`;
  return (
    <div>
      <h1>Template Literals</h1>
      <p>Greet: {greeting}</p>
      <p>Info: {info}</p>
    </div>
  );
}
