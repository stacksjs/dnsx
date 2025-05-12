# API Reference

This section provides detailed documentation for the DNS client library's API.

## DnsClient

The main class for performing DNS queries.

### Constructor

```ts
constructor(options: DnsClientOptions)
```

#### DnsClientOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `domains` | `string[]` | `[]` | List of domains to query |
| `transport` | `TransportOptions` | `{ type: 'udp' }` | Transport configuration |
| `timeout` | `number` | `5000` | Query timeout in milliseconds |
| `retries` | `number` | `3` | Number of retry attempts |

### Methods

#### query()

Performs a DNS query.

```ts
async query(options: QueryOptions): Promise<DnsResponse>
```

##### QueryOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | Required | Domain name to query |
| `type` | `RecordType` | `'A'` | DNS record type |
| `class` | `DnsClass` | `'IN'` | DNS class |

##### Returns

Returns a `Promise<DnsResponse>` containing the query results.

#### Example

```ts
const client = new DnsClient({
  domains: ['example.com'],
  transport: {
    type: 'tcp',
    timeout: 5000
  }
})

const response = await client.query({
  name: 'example.com',
  type: 'A'
})
```

## TransportOptions

Configuration options for DNS transport protocols.

### UDP Transport

```ts
interface UdpTransportOptions {
  type: 'udp'
  port?: number // Default: 53
  timeout?: number // Default: 5000
  retries?: number // Default: 3
}
```

### TCP Transport

```ts
interface TcpTransportOptions {
  type: 'tcp'
  port?: number // Default: 53
  timeout?: number // Default: 5000
  keepAlive?: boolean // Default: false
}
```

### TLS Transport (DoT)

```ts
interface TlsTransportOptions {
  type: 'tls'
  port?: number // Default: 853
  timeout?: number // Default: 5000
  serverName?: string // Required for certificate validation
  verify?: boolean // Default: true
}
```

### HTTPS Transport (DoH)

```ts
interface HttpsTransportOptions {
  type: 'https'
  url: string // Required: DoH endpoint URL
  timeout?: number // Default: 5000
  headers?: Record<string, string>
}
```

## DnsResponse

The response object returned from DNS queries.

```ts
interface DnsResponse {
  id: number // Query ID
  flags: DnsFlags // Response flags
  questions: Question[] // Query questions
  answers: Answer[] // Answer records
  authority: Answer[] // Authority records
  additional: Answer[] // Additional records
}
```

### Record Types

Available DNS record types:

```ts
type RecordType =
  | 'A' // IPv4 address
  | 'AAAA' // IPv6 address
  | 'CNAME' // Canonical name
  | 'MX' // Mail exchange
  | 'NS' // Name server
  | 'PTR' // Pointer
  | 'SOA' // Start of authority
  | 'SRV' // Service
  | 'TXT' // Text
  | 'CAA' // Certification Authority Authorization
  | 'TLSA' // TLSA certificate association
```

## Error Handling

The library throws typed errors for different failure scenarios:

```ts
class DnsError extends Error {
  code: string
  cause?: Error
}

class TimeoutError extends DnsError {
  // Thrown when a query times out
}

class TransportError extends DnsError {
  // Thrown for transport-related failures
}

class FormatError extends DnsError {
  // Thrown for malformed DNS messages
}
```

### Error Handling Example

```ts
try {
  const response = await client.query({
    name: 'example.com',
    type: 'A'
  })
}
catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Query timed out')
  }
  else if (error instanceof TransportError) {
    console.error('Transport failure:', error.message)
  }
  else {
    console.error('Unexpected error:', error)
  }
}
```

## Events

The DnsClient is an EventEmitter and emits the following events:

```ts
client.on('query', (query: QueryOptions) => {
  // Emitted before sending a query
})

client.on('response', (response: DnsResponse) => {
  // Emitted when receiving a response
})

client.on('error', (error: DnsError) => {
  // Emitted on query errors
})
```

## Type Definitions

For TypeScript users, all types are exported and fully documented:

```ts
export type {
  Answer,
  DnsClass,
  DnsClientOptions,
  DnsFlags,
  DnsResponse,
  QueryOptions,
  Question,
  RecordType,
  TransportOptions
}
```
