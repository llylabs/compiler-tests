// @expect-contains: <a href="/about">
// @expect-contains: <img src="/logo.png"
// @expect-contains: About Us
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

function Page() {
  return (
    <div>
      <Link href="/about">About Us</Link>
      <Image src="/logo.png" alt="Logo" width={100} height={50} />
    </div>
  );
}

var html = renderToString(<Page />);
if (!html.includes('href="/about"')) throw new Error('Missing link href');
if (!html.includes('src="/logo.png"')) throw new Error('Missing image src');
console.log(html);
