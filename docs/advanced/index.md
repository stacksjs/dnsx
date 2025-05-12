# Advanced Usage

This section covers advanced features and usage patterns of the DNS client library. These topics are intended for users who need more control and customization over DNS queries and responses.

## Transport Configuration

The library supports multiple transport protocols with advanced configuration options:

```ts
// TCP with custom timeouts and keep-alive
const client = new DnsClient({
  transport: {
    type: 'tcp',
    timeout: 5000,
    keepAlive: true,
    retries: 3
  }
})

// DNS-over-TLS with certificate validation
const tlsClient = new DnsClient({
  transport: {
    type: 'tls',
    serverName: 'dns.example.com',
    verify: true,
    port: 853
  }
})

// DNS-over-HTTPS with custom headers
const dohClient = new DnsClient({
  transport: {
    type: 'https',
    url: 'https://dns.example.com/dns-query',
    headers: {
      Accept: 'application/dns-json'
    }
  }
})
```

## DNSSEC Validation

DNSSEC (DNS Security Extensions) provides authentication and integrity verification:

```ts
const client = new DnsClient({
  dnssec: {
    enabled: true,
    validateSignatures: true,
    requireSignatures: true
  }
})

// Query with DNSSEC validation
const response = await client.query({
  name: 'example.com',
  type: 'A',
  dnssec: true
})

// Check DNSSEC status
if (response.flags.authenticData) {
  console.log('Response is DNSSEC validated')
  console.log('Signature:', response.additional.find(r => r.type === 'RRSIG'))
}
```

## Complex Record Types

Working with complex DNS record types:

### CAA (Certification Authority Authorization)

```ts
const caaResponse = await client.query({
  name: 'example.com',
  type: 'CAA'
})

// CAA record structure
interface CAARecord {
  flags: number
  tag: string // 'issue', 'issuewild', or 'iodef'
  value: string // CA domain or reporting URL
}
```

### SRV (Service) Records

```ts
const srvResponse = await client.query({
  name: '_http._tcp.example.com',
  type: 'SRV'
})

// SRV record structure
interface SRVRecord {
  priority: number
  weight: number
  port: number
  target: string
}
```

### TLSA (TLS Authentication)

```ts
const tlsaResponse = await client.query({
  name: '_443._tcp.example.com',
  type: 'TLSA'
})

// TLSA record structure
interface TLSARecord {
  certUsage: number
  selector: number
  matchingType: number
  certificateData: string
}
```

## Certificate Validation

Advanced certificate validation for secure transports:

```ts
const client = new DnsClient({
  transport: {
    type: 'tls',
    serverName: 'dns.example.com',
    verify: true,
    ca: [
      // Custom CA certificates
      fs.readFileSync('custom-ca.pem')
    ],
    verifyOptions: {
      // Custom verification options
      rejectUnauthorized: true,
      checkServerIdentity: (host, cert) => {
        // Custom identity verification
        if (cert.subject.CN !== host) {
          throw new Error('Certificate CN mismatch')
        }
      }
    }
  }
})
```

## Error Handling and Validation

Comprehensive error handling for advanced use cases:

```ts
try {
  const response = await client.query({
    name: 'example.com',
    type: 'A',
    validate: true // Enable additional validation
  })
}
catch (error) {
  if (error instanceof DnssecError) {
    console.error('DNSSEC validation failed:', error.message)
    console.error('Signature:', error.signature)
  }
  else if (error instanceof CertificateError) {
    console.error('Certificate validation failed:', error.message)
    console.error('Certificate:', error.cert)
  }
  else if (error instanceof TransportError) {
    console.error('Transport error:', error.message)
    console.error('Retry count:', error.retries)
  }
}
```

## Best Practices

When working with advanced DNS features:

1. **Understand Basics**: Make sure you're familiar with basic DNS concepts and the core features
2. **Security First**: Always consider security implications when configuring DNS settings
3. **Test Thoroughly**: Advanced features require comprehensive testing
4. **Monitor Performance**: Watch for performance impacts when using advanced options
5. **Stay Updated**: Keep up with DNS protocol changes and best practices

## Example Usage

Here's an example of advanced client configuration:

```ts
// Advanced DNS client configuration
const client = new DnsClient({
  domains: ['example.com'],
  transport: {
    type: 'tcp',
    timeout: 5000,
    retries: 3,
    retryStrategy: (attempt, error) => {
      return Math.min(1000 * 2 ** attempt, 10000)
    }
  }
})
```

## Related Features

For basic features and core functionality, refer to the [Features](../features/index.md) section:

- [Transport Protocols](../features/transport.md)
- [Record Types](../features/record-types.md)
