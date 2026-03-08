import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  { ignores: ['coverage/**'] },
  ...coreWebVitals,
  ...typescript,
]

export default eslintConfig
