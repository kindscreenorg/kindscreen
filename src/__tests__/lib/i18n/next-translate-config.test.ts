import { describe, it, expect } from 'vitest'
import { nextTranslateConfig } from '@/lib/i18n/next-translate-config'

describe('nextTranslateConfig', () => {
  it('exports loader config with defaultNS and keySeparator', () => {
    expect(nextTranslateConfig).toEqual({
      defaultNS: 'common',
      keySeparator: '.',
    })
  })
})
