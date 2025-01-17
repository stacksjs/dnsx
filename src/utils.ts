import type { ProtocolTweaks } from './types'

export function parseProtocolTweaks(tweaks: string | string[] | undefined): ProtocolTweaks | undefined {
  if (!tweaks)
    return undefined

  const tweakArray = Array.isArray(tweaks) ? tweaks : [tweaks]
  const result: ProtocolTweaks = {}

  for (const tweak of tweakArray) {
    if (tweak === 'aa' || tweak === 'authoritative')
      result.authoritative = true
    else if (tweak === 'ad' || tweak === 'authentic')
      result.authenticData = true
    else if (tweak === 'cd' || tweak === 'checking-disabled')
      result.checkingDisabled = true
    else if (tweak.startsWith('bufsize='))
      result.udpPayloadSize = Number.parseInt(tweak.split('=')[1])
  }

  return result
}

export function debugLog(category: string, message: string, verbose?: boolean): void {
  if (verbose) {
    // eslint-disable-next-line no-console
    console.debug(`[dnsx:${category}] ${message}`)
  }
}
