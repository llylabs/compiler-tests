import { Inter } from 'next/font/google';

const inter = Inter({ weight: ['400', '700'], subsets: ['latin'] });

export default function FontTestPage() {
  return (
    <div className={inter.className}>
      <h1 style={inter.style}>Font Test</h1>
      <p>variable: {inter.variable}</p>
      <p>className: {inter.className}</p>
    </div>
  );
}
