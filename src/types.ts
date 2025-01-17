import type { TransportType } from './transport'

/**
 * DNS Record Types
 */
export enum RecordType {
  A = 1,
  NS = 2,
  CNAME = 5,
  SOA = 6,
  PTR = 12,
  MX = 15,
  TXT = 16,
  AAAA = 28,
  SRV = 33,
  NAPTR = 35,
  OPT = 41,
  SSHFP = 44,
  TLSA = 52,
  DNSKEY = 48,
  CAA = 257,
}

/**
 * DNS Query Classes
 */
export enum QClass {
  IN = 1, // Internet
  CH = 3, // CHAOS
  HS = 4, // Hesiod
}

/**
 * EDNS Mode Configuration
 */
export enum EDNSMode {
  Disable = 'disable',
  Hide = 'hide',
  Show = 'show',
}

/**
 * Protocol Tweak Options
 */
export interface ProtocolTweaks {
  authoritative?: boolean
  authenticData?: boolean
  checkingDisabled?: boolean
  udpPayloadSize?: number
}

/**
 * Transport Protocol Configuration
 */
export interface TransportConfig {
  type?: TransportType
  udp?: boolean
  tcp?: boolean
  tls?: boolean
  https?: boolean
  timeout?: number
  retries?: number
}

/**
 * Query Configuration
 */
export interface QueryConfig {
  domains: string[] // Domains to query
  types?: (RecordType | string)[] // Record types to query
  classes?: (QClass | string)[] // Query classes
  nameserver?: string // Nameserver to use
  recursive?: boolean // Enable recursion
}

/**
 * Output Configuration
 */
export interface OutputConfig {
  short?: boolean // Show only first result
  json?: boolean // Output as JSON
  color?: 'always' | 'auto' | 'never' // When to use colors
  seconds?: boolean // Show raw seconds
  time?: boolean // Show query time
}

/**
 * Complete DNS Client Options
 */
export interface DnsOptions {
  // Query options (can be set via -q, --query, etc.)
  domains?: string[] // Domains to query
  type?: string | string[] // Record types to query
  nameserver?: string // Nameserver to use
  class?: string | string[] // Query classes

  // Protocol options
  edns?: EDNSMode // EDNS configuration
  txid?: number // Transaction ID
  Z?: string | string[] // Protocol tweaks

  // Transport options
  udp?: boolean // Use UDP (default)
  tcp?: boolean // Use TCP
  tls?: boolean // Use TLS
  https?: boolean // Use HTTPS
  timeout?: number // Query timeout (ms)
  retries?: number // Query retries

  // Output options
  short?: boolean // Short output
  json?: boolean // JSON output
  color?: 'always' | 'auto' | 'never' // Color output
  seconds?: boolean // Raw seconds
  time?: boolean // Show time

  // Advanced options
  tweaks?: ProtocolTweaks // Protocol tweaks
  transport?: TransportConfig | TransportType // Transport configuration
  query?: QueryConfig // Query config
  output?: OutputConfig // Output config
  verbose?: boolean // Verbose logging
}

/**
 * DNS Answer Record
 */
export interface DnsAnswer {
  name: string // Record name
  type: RecordType // Record type
  class: QClass // Record class
  ttl: number // Time to live
  data: any // Record data
}

/**
 * DNS Response
 */
export interface DnsResponse {
  id: number // Transaction ID
  flags: DnsFlags // DNS flags
  answers: DnsAnswer[] // Answer records
  authorities: DnsAnswer[] // Authority records
  additionals: DnsAnswer[] // Additional records
}

/**
 * DNS Header Flags
 */
export interface DnsFlags {
  response: boolean // Response flag
  opcode: number // Operation code
  authoritative: boolean // Authoritative answer
  truncated: boolean // Truncated response
  recursionDesired: boolean // Recursion desired
  recursionAvailable: boolean // Recursion available
  authenticData: boolean // Authentic data
  checkingDisabled: boolean // Checking disabled
  responseCode: number // Response code
}

/**
 * DNS Error Response Codes
 */
export enum DnsResponseCode {
  NoError = 0, // No error
  FormErr = 1, // Format error
  ServFail = 2, // Server failure
  NXDomain = 3, // Non-existent domain
  NotImp = 4, // Not implemented
  Refused = 5, // Query refused
  YXDomain = 6, // Name exists
  YXRRSet = 7, // RR set exists
  NXRRSet = 8, // RR set does not exist
  NotAuth = 9, // Server not authoritative
  NotZone = 10, // Name not contained in zone
}

/**
 * Wire Format Error Types
 */
export enum WireError {
  TruncatedPacket = 'TRUNCATED_PACKET',
  InvalidLength = 'INVALID_LENGTH',
  InvalidFormat = 'INVALID_FORMAT',
  InvalidName = 'INVALID_NAME',
  InvalidLabel = 'INVALID_LABEL',
  InvalidPointer = 'INVALID_POINTER',
  InvalidType = 'INVALID_TYPE',
  InvalidClass = 'INVALID_CLASS',
  NetworkError = 'NETWORK_ERROR',
}

export interface DnsQuery {
  name: string
  type: RecordType
  class: QClass
}
