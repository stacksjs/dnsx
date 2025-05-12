# DNS Record Types

The DNS client supports all standard DNS record types as defined in various RFCs. This document covers the available record types and their usage.

## Supported Record Types

| Type | Value | Description | Example Data |
|------|-------|-------------|--------------|
| A | 1 | IPv4 address | `"93.184.216.34"` |
| NS | 2 | Nameserver | `"ns1.example.com"` |
| CNAME | 5 | Canonical name | `"www.example.com"` |
| SOA | 6 | Start of authority | Complex record |
| PTR | 12 | Pointer record | `"host.example.com"` |
| MX | 15 | Mail exchange | `{ preference: 10, exchange: "mail.example.com" }` |
| TXT | 16 | Text record | `"v=spf1 include:_spf.example.com ~all"` |
| AAAA | 28 | IPv6 address | `"2606:2800:220:1:248:1893:25c8:1946"` |
| SRV | 33 | Service location | Complex record |
| NAPTR | 35 | Name authority pointer | Complex record |
| OPT | 41 | EDNS(0) | Used for EDNS support |
| SSHFP | 44 | SSH fingerprint | Complex record |
| TLSA | 52 | TLS certificate association | Complex record |
| DNSKEY | 48 | DNSSEC public key | Complex record |
| CAA | 257 | Certification authority authorization | Complex record |

## Usage Examples

### Basic Query

```ts
// Single record type
const client = new DnsClient({
  domains: ['example.com'],
  type: 'A'
})

// Multiple record types
const client = new DnsClient({
  domains: ['example.com'],
  type: ['A', 'AAAA', 'MX']
})
```

### CLI Usage

```bash
# Single record type
dnsx example.com A

# Multiple record types
dnsx example.com A AAAA MX

# All supported record types
dnsx example.com --type=any
```

## Response Format

Each record in the response follows this structure:

```ts
interface DnsAnswer {
  name: string // Domain name
  type: RecordType // Record type (numeric)
  class: QClass // Usually IN (1)
  ttl: number // Time-to-live in seconds
  data: any // Record type specific data
}
```

### Example Responses

#### A Record

```ts
{
  name: "example.com",
  type: 1,              // RecordType.A
  class: 1,             // QClass.IN
  ttl: 3600,
  data: "93.184.216.34"
}
```

#### MX Record

```ts
{
  name: "example.com",
  type: 15,             // RecordType.MX
  class: 1,             // QClass.IN
  ttl: 3600,
  data: {
    preference: 10,
    exchange: "mail.example.com"
  }
}
```

## Best Practices

1. **Query Efficiency**: Only request the record types you need
2. **Multiple Types**: Use array syntax for multiple record types
3. **TTL Handling**: Always respect the TTL values in responses
4. **Error Handling**: Handle cases where records don't exist
5. **DNSSEC**: Use appropriate record types for DNSSEC validation

## Advanced Usage

For more complex record type handling and examples, see:

- [DNSSEC Records](../advanced/dnssec.md)
- [Complex Record Types](../advanced/complex-records.md)
- [Record Type Validation](../advanced/validation.md)
