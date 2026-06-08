// @expect-contains: <h1>Welcome back, Admin</h1>
// @expect-contains: <button>Logout</button>
import React from 'react'

function AuthStatus({isLoggedIn, username}: {isLoggedIn: boolean, username: string}) {
  if (isLoggedIn) {
    return (
      <div>
        <h1>Welcome back, {username}</h1>
        <button>Logout</button>
      </div>
    );
  }
  return (
    <div>
      <h1>Please log in</h1>
      <button>Login</button>
    </div>
  );
}

function Page() {
  return <AuthStatus isLoggedIn={true} username="Admin" />;
}

var html = renderToString(<Page />);
if (!html.includes('Welcome back')) throw new Error('Missing welcome');
if (!html.includes('Logout')) throw new Error('Missing logout button');
console.log(html);
