"use client";
import React from 'react';

export default function ClientCounterPage() {
  const [count, setCount] = React.useState(7);
  const [name, setName] = React.useState("World");
  return (
    <div>
      <h1>Client Counter</h1>
      <p>Count: {count}</p>
      <p>Greeting: Hello {name}</p>
      <button onClick={function() { setCount(count + 1); }}>+1</button>
      <input value={name} onChange={function(e) { setName(e.target.value); }} />
    </div>
  );
}
