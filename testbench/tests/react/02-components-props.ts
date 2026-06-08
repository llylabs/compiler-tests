// @expect-contains: <h1>Welcome, NEX</h1>
// @expect-contains: <p>Version: 1.0</p>
import React from 'react'
import { renderToString } from 'react-dom/server'

function Header({ title }: { title: string }) {
  return React.createElement('h1', null, title)
}

function Info({ version }: { version: string }) {
  return React.createElement('p', null, `Version: ${version}`)
}

function App() {
  return React.createElement('div', null,
    React.createElement(Header, { title: 'Welcome, NEX' }),
    React.createElement(Info, { version: '1.0' }),
  )
}

const html = renderToString(React.createElement(App, null))

if (!html.includes('Welcome, NEX')) throw new Error('Missing title: ' + html)
if (!html.includes('Version: 1.0')) throw new Error('Missing version: ' + html)
console.log(html)
