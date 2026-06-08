'use client';
import React from 'react';

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  function onSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (email && password) {
      setError("");
    } else {
      setError("Missing fields");
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <input type="email" value={email} placeholder="Email" />
        <input type="password" value={password} placeholder="Password" />
        <button type="submit">Sign in</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
