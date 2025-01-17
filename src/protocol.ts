import type { DnsAnswer, DnsQuery, DnsResponse, EDNSMode, ProtocolTweaks } from './types'
import { Buffer } from 'node:buffer'
import { RecordType } from './types'

// Wire format constants
const DNS_HEADER_SIZE = 12
const MAX_LABEL_LENGTH = 63
const MAX_NAME_LENGTH = 255

/**
 * DNS header flags
 */
export class DnsFlags {
  response = false
  opcode = 0
  authoritative = false
  truncated = false
  recursionDesired = false
  recursionAvailable = false
  authenticData = false
  checkingDisabled = false
  responseCode = 0

  static fromBuffer(buffer: Buffer): DnsFlags {
    const flags = new DnsFlags()
    const byte1 = buffer[2]
    const byte2 = buffer[3]

    flags.response = (byte1 & 0x80) !== 0
    flags.opcode = (byte1 & 0x78) >>> 3
    flags.authoritative = (byte1 & 0x04) !== 0
    flags.truncated = (byte1 & 0x02) !== 0
    flags.recursionDesired = (byte1 & 0x01) !== 0
    flags.recursionAvailable = (byte2 & 0x80) !== 0
    flags.authenticData = (byte2 & 0x20) !== 0
    flags.checkingDisabled = (byte2 & 0x10) !== 0
    flags.responseCode = byte2 & 0x0F

    return flags
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(2)

    if (this.response)
      buffer[0] |= 0x80
    buffer[0] |= (this.opcode & 0x0F) << 3
    if (this.authoritative)
      buffer[0] |= 0x04
    if (this.truncated)
      buffer[0] |= 0x02
    if (this.recursionDesired)
      buffer[0] |= 0x01

    if (this.recursionAvailable)
      buffer[1] |= 0x80
    if (this.authenticData)
      buffer[1] |= 0x20
    if (this.checkingDisabled)
      buffer[1] |= 0x10
    buffer[1] |= this.responseCode & 0x0F

    return buffer
  }
}

/**
 * DNS wire format encoder
 */
export class DnsEncoder {
  private buffer: Buffer
  private offset: number
  private nameOffsets: Map<string, number>

  constructor(size = 512) {
    this.buffer = Buffer.alloc(size)
    this.offset = 0
    this.nameOffsets = new Map()
  }

  writeHeader(id: number, flags: DnsFlags, counts: {
    qdcount: number
    ancount: number
    nscount: number
    arcount: number
  }): void {
    console.debug('Writing DNS header:', {
      id,
      flags: {
        response: flags.response,
        opcode: flags.opcode,
        recursionDesired: flags.recursionDesired,
      },
      counts,
    })

    this.writeUint16(id)
    const flagsBuffer = flags.toBuffer()
    this.buffer.set(flagsBuffer, this.offset)
    this.offset += 2
    this.writeUint16(counts.qdcount)
    this.writeUint16(counts.ancount)
    this.writeUint16(counts.nscount)
    this.writeUint16(counts.arcount)
  }

  writeName(name: string): void {
    console.debug('Writing DNS name:', name)
    const labels = name.split('.')

    for (const label of labels) {
      if (label.length > MAX_LABEL_LENGTH) {
        throw new Error(`Label too long: ${label}`)
      }

      // Write label length and data
      this.buffer[this.offset++] = label.length
      this.buffer.write(label, this.offset)
      this.offset += label.length
    }

    // Terminal zero
    this.buffer[this.offset++] = 0
  }

  // Write question section
  writeQuestion(query: DnsQuery): void {
    this.writeName(query.name)
    this.writeUint16(query.type)
    this.writeUint16(query.class)
  }

  private writeUint16(value: number): void {
    this.buffer.writeUInt16BE(value, this.offset)
    this.offset += 2
  }

  private writeUint32(value: number): void {
    this.buffer.writeUInt32BE(value, this.offset)
    this.offset += 4
  }

  // Get final buffer
  getBuffer(): Buffer {
    return this.buffer.slice(0, this.offset)
  }
}

/**
 * DNS wire format decoder
 */
export class DnsDecoder {
  private buffer: Buffer
  private offset: number

  constructor(buffer: Buffer) {
    this.buffer = buffer
    this.offset = 0
  }

  // Read header section
  readHeader(): {
    id: number
    flags: DnsFlags
    counts: {
      qdcount: number
      ancount: number
      nscount: number
      arcount: number
    }
  } {
    if (this.buffer.length < DNS_HEADER_SIZE) {
      throw new Error(`Invalid DNS header size: ${this.buffer.length} bytes`)
    }

    const id = this.readUint16()
    const flags = DnsFlags.fromBuffer(this.buffer.slice(this.offset, this.offset + 2))
    this.offset += 2

    const counts = {
      qdcount: this.readUint16(),
      ancount: this.readUint16(),
      nscount: this.readUint16(),
      arcount: this.readUint16(),
    }

    console.debug('Read DNS header:', { id, flags, counts })
    return { id, flags, counts }
  }

  // Read question section
  readQuestion(): DnsQuery {
    const name = this.readName()
    const type = this.readUint16()
    const qclass = this.readUint16()

    return {
      name,
      type,
      class: qclass,
    }
  }

  // Read resource record
  readAnswer(): DnsAnswer {
    const name = this.readName()
    const type = this.readUint16()
    const qclass = this.readUint16()
    const ttl = this.readUint32()
    const rdlength = this.readUint16()
    const rdata = this.readRData(type, rdlength)

    return {
      name,
      type,
      class: qclass,
      ttl,
      data: rdata,
    }
  }

  // Read domain name with compression
  private readName(): string {
    const labels: string[] = []
    let length = this.buffer[this.offset++]

    while (length > 0) {
      // Check for compression pointer
      if ((length & 0xC0) === 0xC0) {
        const pointer = ((length & 0x3F) << 8) | this.buffer[this.offset++]
        const savedOffset = this.offset
        this.offset = pointer
        labels.push(this.readName())
        this.offset = savedOffset
        break
      }

      // Regular label
      const label = this.buffer.slice(this.offset, this.offset + length).toString()
      labels.push(label)
      this.offset += length
      length = this.buffer[this.offset++]
    }

    return labels.join('.')
  }

  // Read record type-specific data
  private readRData(type: number, length: number): any {
    const startPos = this.offset
    let data: any

    switch (type) {
      case RecordType.A:
        data = this.readIPv4()
        break
      case RecordType.AAAA:
        data = this.readIPv6()
        break
      case RecordType.MX:
        data = {
          preference: this.readUint16(),
          exchange: this.readName(),
        }
        break
      case RecordType.TXT:
        data = this.readString(length)
        break
      case RecordType.CNAME:
      case RecordType.NS:
      case RecordType.PTR:
        data = this.readName()
        break
      default:
        // Raw data for unknown types
        data = this.buffer.slice(this.offset, this.offset + length)
        this.offset += length
    }

    // Ensure we consumed exactly rdlength bytes
    const consumed = this.offset - startPos
    if (consumed !== length) {
      throw new Error(`Record data length mismatch: expected ${length}, consumed ${consumed}`)
    }

    return data
  }

  private readUint16(): number {
    const value = this.buffer.readUInt16BE(this.offset)
    this.offset += 2
    return value
  }

  private readUint32(): number {
    const value = this.buffer.readUInt32BE(this.offset)
    this.offset += 4
    return value
  }

  private readIPv4(): string {
    const octets: number[] = []
    for (let i = 0; i < 4; i++) {
      octets.push(this.buffer[this.offset++])
    }
    return octets.join('.')
  }

  private readIPv6(): string {
    const parts: string[] = []
    for (let i = 0; i < 8; i++) {
      parts.push(this.buffer.readUInt16BE(this.offset).toString(16))
      this.offset += 2
    }
    return parts.join(':')
  }

  private readString(length: number): string {
    const str = this.buffer.slice(this.offset, this.offset + length).toString()
    this.offset += length
    return str
  }
}

/**
 * Build a DNS query packet
 */
export function buildQuery(query: DnsQuery, options: {
  id?: number
  txid?: number
  edns?: EDNSMode
  tweaks?: ProtocolTweaks
} = {}): Buffer {
  const encoder = new DnsEncoder()

  // Create flags with correct settings
  const flags = new DnsFlags()
  flags.recursionDesired = true // We want recursive queries
  flags.response = false // This is a query, not a response

  // Use provided ID or generate random
  const id = options.txid ?? options.id ?? Math.floor(Math.random() * 65536)

  // Write header with proper counts
  encoder.writeHeader(id, flags, {
    qdcount: 1, // One question
    ancount: 0, // No answers in query
    nscount: 0, // No authority records
    arcount: 0, // No additional records
  })

  // Write question with correct type conversion
  encoder.writeQuestion({
    name: query.name,
    type: typeof query.type === 'string' ? RecordType[query.type as keyof typeof RecordType] : query.type,
    class: query.class,
  })

  return encoder.getBuffer()
}

/**
 * Parse a DNS response packet
 */
export function parseResponse(buffer: Buffer): DnsResponse {
  const decoder = new DnsDecoder(buffer)

  const { id, flags, counts } = decoder.readHeader()

  if (!flags.response) {
    throw new Error('Not a DNS response')
  }

  // Skip questions
  for (let i = 0; i < counts.qdcount; i++) {
    decoder.readQuestion()
  }

  // Read answers
  const answers: DnsAnswer[] = []
  for (let i = 0; i < counts.ancount; i++) {
    answers.push(decoder.readAnswer())
  }

  // Read authority records
  const authorities: DnsAnswer[] = []
  for (let i = 0; i < counts.nscount; i++) {
    authorities.push(decoder.readAnswer())
  }

  // Read additional records
  const additionals: DnsAnswer[] = []
  for (let i = 0; i < counts.arcount; i++) {
    additionals.push(decoder.readAnswer())
  }

  return {
    id,
    flags,
    answers,
    authorities,
    additionals,
  }
}

function validateDnsMessage(buffer: Buffer, isResponse: boolean = false): void {
  if (buffer.length < DNS_HEADER_SIZE) {
    throw new Error(`DNS message too short: ${buffer.length} bytes`)
  }

  const id = buffer.readUInt16BE(0)
  const flags = buffer.readUInt16BE(2)
  const qdcount = buffer.readUInt16BE(4)
  const ancount = buffer.readUInt16BE(6)
  const nscount = buffer.readUInt16BE(8)
  const arcount = buffer.readUInt16BE(10)

  console.debug('Validating DNS message:', {
    id,
    flags: flags.toString(16),
    qdcount,
    ancount,
    nscount,
    arcount,
    isResponse,
    messageLength: buffer.length,
  })

  if (isResponse && !(flags & 0x8000)) {
    throw new Error('Response bit not set in DNS response')
  }
}
