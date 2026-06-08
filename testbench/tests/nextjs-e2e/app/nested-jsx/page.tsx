export default function NestedJsxPage() {
  return (
    <div>
      <h1>Nested JSX</h1>
      <section>
        <article>
          <header>
            <h2>Article Title</h2>
            <p>Subtitle here</p>
          </header>
          <div className="content">
            <div className="row">
              <div className="col">
                <p>Column 1 line 1</p>
                <p>Column 1 line 2</p>
              </div>
              <div className="col">
                <p>Column 2 line 1</p>
                <ul>
                  <li>Bullet A</li>
                  <li>
                    Bullet B
                    <ul>
                      <li>Sub-bullet B.1</li>
                      <li>Sub-bullet B.2</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <footer>End of article</footer>
        </article>
      </section>
    </div>
  );
}
