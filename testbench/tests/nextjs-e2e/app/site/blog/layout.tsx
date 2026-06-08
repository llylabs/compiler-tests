// Inner layout — wraps site/blog/* pages
export default function BlogLayout({ children }) {
  return (
    <div className="blog-wrap">
      <aside>Blog sidebar</aside>
      <article>{children}</article>
    </div>
  );
}
