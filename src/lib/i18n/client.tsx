'use client'

import { createContext, useContext } from 'react'
import type { Strings } from './strings'

const LocaleContext = createContext<Strings | null>(null)

export function LocaleProvider({
  t,
  children,
}: {
  t: Strings
  children: React.ReactNode
}) {
  return <LocaleContext.Provider value={t}>{children}</LocaleContext.Provider>
}

export function useT(): Strings {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useT must be used inside LocaleProvider')
  return ctx
}
