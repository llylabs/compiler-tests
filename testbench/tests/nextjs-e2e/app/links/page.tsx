import Link from 'next/link';
import Image from 'next/image';

export default function LinksPage() {
  return (
    <div>
      <Link href="/about">Go to About</Link>
      <Image src="/logo.png" alt="Logo" width={120} height={40} />
    </div>
  );
}
