// @expect-contains: <header>
// @expect-contains: <main>
// @expect-contains: <footer>
// @expect-contains: NEX App
import React from 'react'
import { renderToString } from 'react-dom/server'

function Header() {
  return React.createElement('header', null,
    React.createElement('h1', null, 'NEX App')
  )
}

function Article({ title, body }: { title: string; body: string }) {
  return React.createElement('article', null,
    React.createElement('h2', null, title),
    React.createElement('p', null, body),
  )
}

function Main() {
  return React.createElement('main', null,
    React.createElement(Article, { title: 'First Post', body: 'Hello from NEX' }),
    React.createElement(Article, { title: 'Second Post', body: 'React SSR works' }),
  )
}

function Footer() {
  return React.createElement('footer', null, '© 2026 NEX')
}

function Page() {
  return React.createElement('div', null,
    React.createElement(Header, null),
    React.createElement(Main, null),
    React.createElement(Footer, null),
  )
}

const html = renderToString(React.createElement(Page, null))

if (!html.includes('<header>'))  throw new Error('Missing header: ' + html)
if (!html.includes('<main>'))    throw new Error('Missing main: ' + html)
if (!html.includes('<footer>'))  throw new Error('Missing footer: ' + html)
if (!html.includes('NEX App'))   throw new Error('Missing title: ' + html)
if (!html.includes('First Post')) throw new Error('Missing article: ' + html)
console.log(html)
