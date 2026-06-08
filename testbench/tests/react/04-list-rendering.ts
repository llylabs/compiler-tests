// @expect-contains: <li>Apple</li>
// @expect-contains: <li>Banana</li>
// @expect-contains: <li>Cherry</li>
import React from 'react'
import { renderToString } from 'react-dom/server'

function List({ items }: { items: string[] }) {
  return React.createElement('ul', null,
    ...items.map((item, i) =>
      React.createElement('li', { key: i }, item)
    )
  )
}

const html = renderToString(React.createElement(List, { items: ['Apple', 'Banana', 'Cherry'] }))

if (!html.includes('<li>Apple</li>'))   throw new Error('Missing Apple: ' + html)
if (!html.includes('<li>Banana</li>'))  throw new Error('Missing Banana: ' + html)
if (!html.includes('<li>Cherry</li>'))  throw new Error('Missing Cherry: ' + html)
console.log(html)
