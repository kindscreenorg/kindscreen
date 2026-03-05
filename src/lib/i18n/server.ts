import { cookies } from 'next/headers'
import { strings } from './strings'
import type { Locale, Strings } from './strings'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get('locale')?.value
  return value === 'pt' ? 'pt' : 'en'
}

export async function getT(): Promise<Strings> {
  const locale = await getLocale()
  return strings[locale]
}
