# Transport Protocols

The DNS client supports multiple transport protocols, each with its own benefits and use cases.

## Available Protocols

### UDP (Default)

- Traditional DNS protocol
- Port 53
- Best for small queries
- Automatic fallback to TCP for truncated responses

```ts
// UDP (default)
const client = new DnsClient({
  domains: ['example.com'],
  type: 'A',
  udp: true // optional, this is default
})
```

### TCP

- Reliable for larger responses
- Port 53
- Required for responses > 512 bytes
- Better for bulk queries

```ts
const client = new DnsClient({
  domains: ['example.com'],
  type: 'A',
  tcp: true
})
```

### DNS-over-TLS (DoT)

- Encrypted DNS queries
- Port 853
- Prevents eavesdropping
- Certificate validation

```ts
const client = new DnsClient({
  domains: ['example.com'],
  type: 'A',
  tls: true,
  nameserver: 'dns.cloudflare.com' // DoT provider
})
```

### DNS-over-HTTPS (DoH)

- HTTPS-encrypted DNS
- Port 443
- Firewall-friendly
- HTTP/2 benefits

```ts
const client = new DnsClient({
  domains: ['example.com'],
  type: 'A',
  https: true,
  nameserver: 'https://cloudflare-dns.com/dns-query'
})
```

## Transport Configuration

You can configure transport-specific options:

```ts
const client = new DnsClient({
  domains: ['example.com'],
  transport: {
    type: 'tcp',
    timeout: 5000, // 5 seconds
    retries: 3 // Retry 3 times
  }
})
```

## CLI Usage

```bash
# UDP (default)
dnsx example.com

# TCP
dnsx example.com -T

# DNS-over-TLS
dnsx example.com -S

# DNS-over-HTTPS
dnsx example.com -H --nameserver https://cloudflare-dns.com/dns-query
```

## Best Practices

1. **Default Choice**: Use UDP for standard queries
2. **Large Responses**: Use TCP for zones with many records
3. **Privacy**: Use DoT or DoH when privacy is important
4. **Firewalls**: Use DoH if standard DNS ports are blocked
5. **Reliability**: Configure timeouts and retries for unreliable networks

## Error Handling

Each transport implements proper error handling:

- Connection timeouts
- Network errors
- Protocol-specific errors (e.g., TLS certificate validation)
- Automatic retry with exponential backoff

## Advanced Usage

For more advanced transport configurations and examples, see the [Advanced Transport](../advanced/transport.md) section.
