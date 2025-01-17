import type { DnsOptions, DnsQuery, DnsResponse } from './types'
import { promises as fs } from 'node:fs'
import { platform } from 'node:os'
import { buildQuery, parseResponse } from './protocol'
import { createTransport, TransportType } from './transport'
import { QClass, RecordType } from './types'

export class DnsClient {
  private options: DnsOptions
  private static readonly DEFAULT_NAMESERVER = '1.1.1.1'
  private static readonly RESOLV_CONF_PATH = '/etc/resolv.conf'
  private static readonly WINDOWS_DNS_KEY = 'SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Nameserver'

  constructor(options: DnsOptions) {
    // The issue is that we're trying to set a TransportType enum value
    // to a TransportConfig object. Let's fix the initialization:
    this.options = {
      transport: {
        type: TransportType.UDP,
      },
      ...options,
    }
  }

  async query(): Promise<DnsResponse[]> {
    try {
      // Create transport based on options
      const transportType = this.determineTransportType()
      const transport = createTransport(transportType)
      const responses: DnsResponse[] = []

      // Build and execute queries
      for (const query of this.buildQueries()) {
        const nameserver = await this.resolveNameserver()
        console.debug('Sending query:', {
          query,
          nameserver,
          transportType,
        })

        const request = buildQuery(query, {
          txid: this.options.txid,
          edns: this.options.edns,
          tweaks: this.options.tweaks,
        })

        console.debug('Built DNS request:', {
          hexData: request.toString('hex'),
          length: request.length,
          txid: request.readUInt16BE(0),
          flags: request.readUInt16BE(2).toString(16),
        })

        // Handle retries
        let lastError: Error | undefined
        const maxRetries = this.options.retries || 3

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            console.debug(`Attempt ${attempt + 1}/${maxRetries}`)
            const response = await transport.query(nameserver, request)

            console.debug('Received DNS response:', {
              hexData: response.toString('hex'),
              length: response.length,
              txid: response.readUInt16BE(0),
              flags: response.readUInt16BE(2).toString(16),
            })

            // Validate DNS message before parsing
            if (response.length < 12) { // Minimum DNS message size
              throw new Error(`Response too short: ${response.length} bytes`)
            }

            const responseFlags = response.readUInt16BE(2)
            if (!(responseFlags & 0x8000)) { // Check QR bit
              throw new Error('Response flag not set in DNS message')
            }

            const parsed = parseResponse(response)
            console.debug('Parsed DNS response:', {
              id: parsed.id,
              answerCount: parsed.answers.length,
              authorityCount: parsed.authorities.length,
              additionalCount: parsed.additionals.length,
            })

            // Check for truncation with UDP
            if (transportType === TransportType.UDP && parsed.flags.truncated) {
              console.debug('Response truncated, retrying with TCP')
              // Retry with TCP if truncated
              const tcpTransport = createTransport(TransportType.TCP)
              const tcpResponse = await tcpTransport.query(nameserver, request)
              responses.push(parseResponse(tcpResponse))
            }
            else {
              responses.push(parsed)
            }

            break // Success, exit retry loop
          }
          catch (err) {
            lastError = err as Error
            console.debug(`Attempt ${attempt + 1} failed:`, (err as Error).message)

            if (attempt === maxRetries - 1) {
              console.debug('All retry attempts failed')
              throw lastError
            }

            // Wait before retry with exponential backoff
            const backoffTime = 2 ** attempt * 1000
            console.debug(`Waiting ${backoffTime}ms before retry`)
            await new Promise(resolve => setTimeout(resolve, backoffTime))
          }
        }
      }

      return responses
    }
    catch (err) {
      throw new Error(`DNS query failed: ${(err as Error).message}`)
    }
  }

  private buildQueries(): DnsQuery[] {
    const queries: DnsQuery[] = []
    // Add validation to ensure domains exists
    if (!this.options.domains?.length) {
      throw new Error('No domains specified')
    }

    const domains = Array.isArray(this.options.domains)
      ? this.options.domains
      : [this.options.domains]

    const types = this.resolveTypes()
    const classes = this.resolveClasses()

    // Build cartesian product of domains, types, and classes
    for (const domain of domains) {
      for (const type of types) {
        for (const qclass of classes) {
          queries.push({ name: domain, type, class: qclass })
        }
      }
    }

    return queries
  }

  private resolveTypes(): RecordType[] {
    if (!this.options.type)
      return [RecordType.A]

    const types = Array.isArray(this.options.type)
      ? this.options.type
      : [this.options.type]

    return types.map((type) => {
      if (typeof type === 'number')
        return type
      const upperType = type.toUpperCase()
      const recordType = RecordType[upperType as keyof typeof RecordType]
      if (recordType === undefined) {
        throw new Error(`Invalid record type: ${type}`)
      }
      return recordType
    })
  }

  private resolveClasses(): QClass[] {
    if (!this.options.class)
      return [QClass.IN]

    const classes = Array.isArray(this.options.class)
      ? this.options.class
      : [this.options.class]

    return classes.map((cls) => {
      if (typeof cls === 'number')
        return cls
      const upperClass = cls.toUpperCase()
      const qclass = QClass[upperClass as keyof typeof QClass]
      if (qclass === undefined) {
        throw new Error(`Invalid query class: ${cls}`)
      }
      return qclass
    })
  }

  private async resolveNameserver(): Promise<string> {
    // Use explicitly configured nameserver
    if (this.options.nameserver) {
      return this.options.nameserver
    }

    try {
      // Platform-specific nameserver resolution
      if (platform() === 'win32') {
        return await this.resolveWindowsNameserver()
      }
      else {
        return await this.resolveUnixNameserver()
      }
    }
    catch (err) {
      // Fallback to default if system resolution fails
      return DnsClient.DEFAULT_NAMESERVER
    }
  }

  private async resolveUnixNameserver(): Promise<string> {
    try {
      const content = await fs.readFile(DnsClient.RESOLV_CONF_PATH, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('nameserver')) {
          const [, nameserver] = trimmed.split(/\s+/)
          if (nameserver)
            return nameserver
        }
      }

      throw new Error('No nameserver found in resolv.conf')
    }
    catch {
      throw new Error('Failed to read resolv.conf')
    }
  }

  private async resolveWindowsNameserver(): Promise<string> {
    try {
      // On Windows, we could use the Registry or PowerShell
      // This is a simplified version - in practice, you might want to use
      // a native module or execute a PowerShell command to get this info
      return DnsClient.DEFAULT_NAMESERVER
    }
    catch {
      throw new Error('Failed to get Windows nameserver')
    }
  }

  private determineTransportType(): TransportType {
    if (this.options.https)
      return TransportType.HTTPS
    if (this.options.tls)
      return TransportType.TLS
    if (this.options.tcp)
      return TransportType.TCP
    if (this.options.udp)
      return TransportType.UDP

    // Check if transport is TransportConfig
    if (typeof this.options.transport === 'object') {
      // Extract type from TransportConfig
      return this.options.transport.type || TransportType.UDP
    }

    // Otherwise assume it's directly a TransportType
    return TransportType.UDP
  }

  private validateOptions() {
    if (!this.options.domains?.length) {
      throw new Error('No domains specified')
    }

    // Validate transport options
    const transportCount = [
      this.options.udp,
      this.options.tcp,
      this.options.tls,
      this.options.https,
    ].filter(Boolean).length

    if (transportCount > 1) {
      throw new Error('Only one transport type can be specified')
    }

    // Validate HTTPS requirements
    if (this.options.https && !this.options.nameserver?.startsWith('https://')) {
      throw new Error('HTTPS transport requires an HTTPS nameserver URL')
    }
  }
}
