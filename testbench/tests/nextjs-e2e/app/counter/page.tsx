"use client";
import React from 'react';

export default function CounterPage() {
  const [count, setCount] = React.useState(0);
  return (
    <div>
      <h1>Counter</h1>
      <p>Count: {count}</p>
      <button onClick={function() { setCount(count + 1); }}>+</button>
    </div>
  );
}
