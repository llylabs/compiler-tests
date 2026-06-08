// Mid-level layout — wraps site/* pages with a chrome
export default function SiteLayout({ children }) {
  return (
    <section className="site-wrap">
      <header><a href="/">Home</a> · <a href="/site/blog/category">Blog</a></header>
      <main>{children}</main>
      <footer>Site footer</footer>
    </section>
  );
}
