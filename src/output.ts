import type { DnsAnswer, DnsResponse } from './types'
import pc from 'picocolors'
import { RecordType } from './types'

export interface OutputOptions {
  json: boolean
  short: boolean
  showDuration?: number
  colors: {
    enabled: boolean
  }
  rawSeconds: boolean
}

const RECORD_COLORS = {
  A: 'green',
  AAAA: 'green',
  CNAME: 'yellow',
  MX: 'cyan',
  NS: 'red',
  PTR: 'red',
  SOA: 'magenta',
  SRV: 'cyan',
  TXT: 'yellow',
  CAA: 'red',
  TLSA: 'yellow',
} as const

export function formatOutput(responses: DnsResponse[], options: OutputOptions): string {
  if (options.json) {
    return formatJson(responses, options.showDuration)
  }

  return formatText(responses, options)
}

function formatJson(responses: DnsResponse[], duration?: number): string {
  const output: any = {
    responses: responses.map(response => ({
      id: response.id,
      answers: response.answers.map(formatJsonAnswer),
      authorities: response.authorities.map(formatJsonAnswer),
      additionals: response.additionals.map(formatJsonAnswer),
    })),
  }

  if (duration !== undefined) {
    output.duration = {
      ms: duration,
    }
  }

  return JSON.stringify(output, null, 2)
}

function formatJsonAnswer(answer: DnsAnswer): any {
  const base = {
    name: answer.name,
    type: RecordType[answer.type] || answer.type,
    ttl: answer.ttl,
  }

  // Format data based on record type
  switch (answer.type) {
    case RecordType.A:
    case RecordType.AAAA:
      return {
        ...base,
        address: answer.data,
      }
    case RecordType.CNAME:
    case RecordType.PTR:
    case RecordType.NS:
      return {
        ...base,
        target: answer.data,
      }
    case RecordType.MX:
      return {
        ...base,
        preference: answer.data.preference,
        exchange: answer.data.exchange,
      }
    case RecordType.TXT:
      return {
        ...base,
        text: answer.data,
      }
    case RecordType.SRV:
      return {
        ...base,
        priority: answer.data.priority,
        weight: answer.data.weight,
        port: answer.data.port,
        target: answer.data.target,
      }
    case RecordType.CAA:
      return {
        ...base,
        flags: answer.data.flags,
        tag: answer.data.tag,
        value: answer.data.value,
      }
    default:
      return {
        ...base,
        data: answer.data,
      }
  }
}

function formatText(responses: DnsResponse[], options: OutputOptions): string {
  const output: string[] = []

  for (const response of responses) {
    if (options.short) {
      // Short mode - only first answer
      if (response.answers.length > 0) {
        output.push(formatAnswer(response.answers[0], options))
      }
      continue
    }

    // Full mode - all sections
    if (response.answers.length > 0) {
      output.push('\nAnswers:')
      for (const answer of response.answers) {
        output.push(formatAnswer(answer, options))
      }
    }

    if (response.authorities.length > 0) {
      output.push('\nAuthority Records:')
      for (const auth of response.authorities) {
        output.push(formatAnswer(auth, options))
      }
    }

    if (response.additionals.length > 0) {
      output.push('\nAdditional Records:')
      for (const additional of response.additionals) {
        output.push(formatAnswer(additional, options))
      }
    }
  }

  if (options.showDuration !== undefined) {
    output.push(`\nQuery time: ${formatDuration(options.showDuration, options.rawSeconds)}`)
  }

  return output.join('\n')
}

function formatAnswer(answer: DnsAnswer, options: OutputOptions): string {
  // Convert record type to string first
  const recordTypeStr = RecordType[answer.type] || answer.type.toString()
  const color = RECORD_COLORS[recordTypeStr as keyof typeof RECORD_COLORS] || 'white'

  const recordTypeFormatted = options.colors.enabled
    ? ((pc as any)[color](recordTypeStr.padEnd(6)))
    : recordTypeStr.padEnd(6)

  const ttlStr = formatTTL(answer.ttl, options.rawSeconds).padStart(8)

  let dataStr: string
  switch (answer.type) {
    case RecordType.A:
    case RecordType.AAAA:
      dataStr = answer.data
      break
    case RecordType.CNAME:
    case RecordType.PTR:
    case RecordType.NS:
      dataStr = answer.data
      break
    case RecordType.MX:
      dataStr = `${answer.data.preference} ${answer.data.exchange}`
      break
    case RecordType.TXT:
      dataStr = `"${answer.data}"`
      break
    case RecordType.SRV:
      dataStr = `${answer.data.priority} ${answer.data.weight} ${answer.data.port} ${answer.data.target}`
      break
    case RecordType.CAA:
      dataStr = `${answer.data.flags} ${answer.data.tag} "${answer.data.value}"`
      break
    default:
      dataStr = JSON.stringify(answer.data)
  }

  return `${recordTypeFormatted} ${ttlStr} ${answer.name.padEnd(30)} ${dataStr}`
}

function formatTTL(seconds: number, raw: boolean): string {
  if (raw)
    return seconds.toString()

  if (seconds < 60) {
    return `${seconds}s`
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m${secs}s`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h${minutes}m`
  }
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return `${days}d${hours}h`
}

function formatDuration(ms: number, raw: boolean): string {
  if (raw)
    return `${ms}ms`

  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}
