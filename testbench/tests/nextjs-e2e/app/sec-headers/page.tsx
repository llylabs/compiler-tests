import { headers } from 'next/headers';

export default function SecPage() {
  var h = headers();
  var host = h.get("Host") || "unknown";
  var ua = h.get("User-Agent") || "unknown";
  return (
    <div>
      <h1>Headers in Page</h1>
      <p>Host: {host}</p>
      <p>UA-len: {ua.length}</p>
    </div>
  );
}
