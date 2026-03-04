import type { Metadata, Viewport } from 'next'
import { Nunito, Poppins } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KindScreen — Parent-reviewed. Kid-approved.',
  description:
    'A curated catalog of YouTube videos safe for children aged 3–12. Watched by real parents. Verified by consensus. Zero surprises.',
  keywords: ['kids videos', 'safe youtube', 'children content', 'parent curated', 'kids safe'],
  openGraph: {
    title: 'KindScreen — Parent-reviewed. Kid-approved.',
    description: 'A curated catalog of YouTube videos safe for children aged 3–12.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${poppins.variable}`}>
      <body className="bg-cream font-sans text-warm antialiased">
        {children}
      </body>
    </html>
  )
}
