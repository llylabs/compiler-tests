"use client";
export default function ErrorBoundary({ error, reset }) {
  return (
    <div>
      <h1>Oops!</h1>
      <p>Caught error: {error && error.message ? error.message : "unknown"}</p>
    </div>
  );
}
