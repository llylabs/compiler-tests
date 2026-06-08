// @expect-contains: class="container"
// @expect-contains: href="https://nex.dev"
// @expect-contains: src="/logo.png"
import React from 'react'
import { renderToString } from 'react-dom/server'

// React uses className → rendered as class in HTML
function Card() {
  return React.createElement('div', { className: 'container' },
    React.createElement('a', { href: 'https://nex.dev' }, 'Visit NEX'),
    React.createElement('img', { src: '/logo.png', alt: 'NEX Logo' }),
  )
}

const html = renderToString(React.createElement(Card, null))

if (!html.includes('class="container"'))        throw new Error('className not rendered: ' + html)
if (!html.includes('href="https://nex.dev"'))   throw new Error('href missing: ' + html)
if (!html.includes('src="/logo.png"'))          throw new Error('src missing: ' + html)
console.log(html)
