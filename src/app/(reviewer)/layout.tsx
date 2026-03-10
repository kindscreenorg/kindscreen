import Link from 'next/link';
import Image from 'next/image';
import { getT } from '@/lib/i18n/server';

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getT();
  return (
    <>
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-cream-200 shadow-warm-sm px-4 h-14 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="KindScreen"
            width={1536}
            height={1024}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <Link href="/reviewer/submit" className="btn-primary text-sm py-2 px-4">
          {t.reviewerDashboard.submitVideo}
        </Link>
      </nav>
      <main className="min-h-screen bg-cream-50">{children}</main>
    </>
  );
}
