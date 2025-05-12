import type { TransportType } from './transport'

/**
 * DNS Record Types as defined in various RFCs.
 * Each type represents a different kind of resource record.
 *
 * Common types:
 * - A (1): IPv4 address
 * - AAAA (28): IPv6 address
 * - MX (15): Mail exchange
 * - TXT (16): Text records
 * - CNAME (5): Canonical name
 * - NS (2): Nameserver
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
 * DNS Query Classes as defined in RFC 1035.
 * The class specifies the protocol group of the record.
 */
export enum QClass {
  IN = 1, // Internet - Most commonly used
  CH = 3, // CHAOS - Rarely used, mainly for server identification
  HS = 4, // Hesiod - Rarely used, for Hesiod directory service
}

/**
 * EDNS (Extension Mechanisms for DNS) Mode Configuration.
 * Controls how EDNS records are handled in queries and responses.
 */
export enum EDNSMode {
  Disable = 'disable', // Don't use EDNS
  Hide = 'hide', // Use EDNS but hide OPT records in output
  Show = 'show', // Use EDNS and show OPT records in output
}

/**
 * Protocol-level tweaks for fine-tuning DNS queries.
 * These options modify the DNS header flags and EDNS parameters.
 */
export interface ProtocolTweaks {
  authoritative?: boolean // Set AA (Authoritative Answer) flag
  authenticData?: boolean // Set AD (Authentic Data) flag
  checkingDisabled?: boolean // Set CD (Checking Disabled) flag
  udpPayloadSize?: number // Set EDNS UDP payload size
}

/**
 * Transport protocol configuration for DNS queries.
 * Supports multiple transport options with retry and timeout settings.
 */
export interface TransportConfig {
  type?: TransportType // Primary transport type
  udp?: boolean // Enable UDP transport
  tcp?: boolean // Enable TCP transport
  tls?: boolean // Enable DNS-over-TLS
  https?: boolean // Enable DNS-over-HTTPS
  timeout?: number // Query timeout in milliseconds
  retries?: number // Number of retry attempts
}

/**
 * Query configuration for DNS lookups.
 * Specifies what to query and how to query it.
 */
export interface QueryConfig {
  domains: string[] // List of domains to query
  types?: (RecordType | string)[] // Record types to query for each domain
  classes?: (QClass | string)[] // Query classes to use
  nameserver?: string // Nameserver to query against
  recursive?: boolean // Whether to request recursive resolution
}

/**
 * Output formatting configuration.
 * Controls how DNS responses are formatted and displayed.
 */
export interface OutputConfig {
  short?: boolean // Show only first result
  json?: boolean // Format output as JSON
  color?: 'always' | 'auto' | 'never' // When to use ANSI colors
  seconds?: boolean // Show TTL in raw seconds
  time?: boolean // Show query execution time
}

/**
 * Complete configuration options for the DNS client.
 * Combines all configuration aspects into a single interface.
 *
 * @example
 * ```ts
 * const options: DnsOptions = {
 *   domains: ['example.com'],
 *   type: 'A',
 *   nameserver: '1.1.1.1',
 *   edns: 'show',
 *   transport: {
 *     type: 'udp',
 *     timeout: 5000
 *   }
 * }
 * ```
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
 * Represents a single DNS resource record in the response.
 * Contains the record's name, type, class, TTL, and data.
 */
export interface DnsAnswer {
  name: string // Domain name this record belongs to
  type: RecordType // Type of resource record
  class: QClass // Record class (usually IN)
  ttl: number // Time-to-live in seconds
  data: any // Record-specific data
}

/**
 * Complete DNS response message structure.
 * Contains the message ID, flags, and all record sections.
 */
export interface DnsResponse {
  id: number // Transaction ID matching the query
  flags: DnsFlags // DNS header flags
  answers: DnsAnswer[] // Answer section records
  authorities: DnsAnswer[] // Authority section records
  additionals: DnsAnswer[] // Additional section records
}

/**
 * DNS message header flags as defined in RFC 1035.
 * Controls various aspects of DNS message processing.
 */
interface DnsFlags {
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
 * Standard DNS response codes as defined in RFC 1035 and others.
 * Indicates the status of the response message.
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
 * Error types that can occur during DNS wire format processing.
 * Used for detailed error reporting in protocol handling.
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

/**
 * Structure of a DNS query message.
 * Contains the essential components needed to form a query.
 */
export interface DnsQuery {
  name: string // Domain name to query
  type: RecordType // Record type to query for
  class: QClass // Query class (usually IN)
}
