import { headers } from 'next/headers';

export default function CspPage() {
  const h = headers();
  const nonce = h.get('x-lly-nonce') || '';
  return (
    <div>
      <h1>CSP Test</h1>
      <p>nonce length: {String(nonce.length)}</p>
      <script dangerouslySetInnerHTML={{ __html: "console.log('inline ok');" }}/>
      <style dangerouslySetInnerHTML={{ __html: ".csp-test{color:red}" }}/>
    </div>
  );
}
