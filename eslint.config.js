import antfu from '@antfu/eslint-config'
import tailwind from 'eslint-plugin-tailwindcss'

export default antfu(
  {
    formatters: true,
    svelte: true,
  },
  ...tailwind.configs['flat/recommended'],
)
