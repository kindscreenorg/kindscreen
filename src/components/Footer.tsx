import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { strings } from '@/lib/i18n/strings'
import LocaleToggle from './LocaleToggle'

export default async function Footer() {
  const locale = await getLocale()
  const t = strings[locale]

  return (
    <footer className="border-t border-cream-200 py-5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warm-400">
      <p>{t.footer.madeWith}</p>
      <div className="flex items-center gap-4">
        <Link href="/privacy" className="hover:text-warm-600 transition-colors">
          {t.footer.privacy}
        </Link>
        <LocaleToggle current={locale} />
      </div>
    </footer>
  )
}
