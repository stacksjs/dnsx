# Transport Configuration

The library supports multiple transport protocols with advanced configuration options for different DNS query scenarios.

## TCP Transport

TCP transport with custom timeouts and keep-alive settings:

```ts
const client = new DnsClient({
  transport: {
    type: 'tcp',
    timeout: 5000,
    keepAlive: true,
    retries: 3
  }
})
```

### TCP Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `5000` | Connection timeout in milliseconds |
| `keepAlive` | `boolean` | `false` | Enable TCP keep-alive |
| `retries` | `number` | `3` | Number of retry attempts |
| `port` | `number` | `53` | TCP port number |

## DNS-over-TLS (DoT)

Secure DNS queries over TLS with certificate validation:

```ts
const tlsClient = new DnsClient({
  transport: {
    type: 'tls',
    serverName: 'dns.example.com',
    verify: true,
    port: 853
  }
})
```

### TLS Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serverName` | `string` | Required | Server hostname for certificate validation |
| `verify` | `boolean` | `true` | Enable certificate verification |
| `port` | `number` | `853` | TLS port number |
| `timeout` | `number` | `5000` | Connection timeout in milliseconds |

## DNS-over-HTTPS (DoH)

Modern HTTPS-based DNS transport with custom headers:

```ts
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

### HTTPS Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | Required | DoH endpoint URL |
| `headers` | `Record<string, string>` | `{}` | Custom HTTP headers |
| `timeout` | `number` | `5000` | Request timeout in milliseconds |

## Advanced Transport Features

### Connection Pooling

For high-performance scenarios:

```ts
const client = new DnsClient({
  transport: {
    type: 'tcp',
    poolSize: 5,
    poolTimeout: 30000,
    keepAlive: true
  }
})
```

### Load Balancing

Using multiple DNS servers:

```ts
const client = new DnsClient({
  transport: {
    type: 'tcp',
    servers: [
      { host: 'dns1.example.com', port: 53 },
      { host: 'dns2.example.com', port: 53 }
    ],
    strategy: 'round-robin' // or 'random', 'failover'
  }
})
```

### Retry Strategy

Custom retry logic:

```ts
const client = new DnsClient({
  transport: {
    type: 'tcp',
    retries: 3,
    retryStrategy: (attempt, error) => {
      // Exponential backoff with jitter
      const delay = Math.min(100 * 2 ** attempt, 2000)
      return delay + Math.random() * 100
    }
  }
})
```
