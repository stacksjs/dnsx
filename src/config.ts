import type { DnsOptions } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: DnsOptions = {
  verbose: true,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: DnsOptions = await loadConfig({
  name: 'dnsx',
  defaultConfig,
})
