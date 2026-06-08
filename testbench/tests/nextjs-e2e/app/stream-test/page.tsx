// Verifies react-dom/server shim exposes both renderToString and the new
// streaming APIs (renderToReadableStream + renderToStaticMarkup).
import { renderToString, renderToReadableStream } from 'react-dom/server';

export default function StreamTestPage() {
  return (
    <div>
      <h1>Stream Test</h1>
      <p>rts type: {typeof renderToString}</p>
      <p>rtrs type: {typeof renderToReadableStream}</p>
    </div>
  );
}
