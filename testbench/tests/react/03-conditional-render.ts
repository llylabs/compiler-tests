// @expect-contains: logged-in
// @expect-contains: guest
import React from 'react'
import { renderToString } from 'react-dom/server'

function UserBadge({ loggedIn }: { loggedIn: boolean }) {
  return React.createElement('span', { className: loggedIn ? 'logged-in' : 'guest' },
    loggedIn ? 'Welcome back!' : 'Please log in'
  )
}

const loggedIn = renderToString(React.createElement(UserBadge, { loggedIn: true }))
const guest    = renderToString(React.createElement(UserBadge, { loggedIn: false }))

if (!loggedIn.includes('logged-in'))   throw new Error('Missing logged-in class: ' + loggedIn)
if (!loggedIn.includes('Welcome back')) throw new Error('Missing logged-in text: ' + loggedIn)
if (!guest.includes('guest'))           throw new Error('Missing guest class: ' + guest)
if (!guest.includes('Please log in'))   throw new Error('Missing guest text: ' + guest)

console.log(loggedIn)
console.log(guest)
