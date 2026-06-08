// @expect-contains: <h1>Hello NEX</h1>
import React from 'react'
import { renderToString } from 'react-dom/server'

const html = renderToString(React.createElement('h1', null, 'Hello NEX'))

if (!html.includes('Hello NEX')) throw new Error('Missing content: ' + html)
console.log(html)
