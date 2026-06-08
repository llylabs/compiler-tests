export default function TemplateWrap({ children }) {
  return (
    <div data-template="true">
      <p>Template wrapped:</p>
      {children}
    </div>
  );
}
