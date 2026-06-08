import { Inter, Geist_Mono } from 'next/font/google';
import localFont from 'next/font/local';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const myLocal = localFont({ src: './my.woff2', variable: '--font-local' });

export default function FontsPage() {
  return (
    <div className={inter.className + ' ' + geistMono.variable + ' ' + myLocal.variable}>
      <h1>Fonts Test</h1>
      <p>Inter className: {inter.className}</p>
      <p>Geist Mono variable: {geistMono.variable}</p>
      <p>Local variable: {myLocal.variable}</p>
    </div>
  );
}
