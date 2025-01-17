import { DnsClient, type DnsOptions, formatOutput } from './src'

async function testDnsClient() {
  console.log('🔍 Testing DNS Client...\n')

  // Test different record types with common DNS servers
  const recordTypes = [
    { type: 'A' as const, domain: 'example.com' },
    { type: 'AAAA' as const, domain: 'google.com' },
    { type: 'MX' as const, domain: 'microsoft.com' },
    { type: 'TXT' as const, domain: 'github.com' },
  ]

  // Test different transport types with properly configured servers
  const transports: Array<{ name: string, options: Partial<DnsOptions> }> = [
    {
      name: 'UDP (Cloudflare)',
      options: {
        nameserver: '1.1.1.1:53', // Explicitly set port for UDP
        udp: true,
      },
    },
    {
      name: 'TCP (Cloudflare)',
      options: {
        nameserver: '1.1.1.1:53', // Explicitly set port for TCP
        tcp: true,
      },
    },
    {
      name: 'TLS (Cloudflare)',
      options: {
        nameserver: '1.1.1.1:853', // Cloudflare's DoT port
        tls: true,
      },
    },
    {
      name: 'HTTPS (Cloudflare)',
      options: {
        nameserver: 'https://cloudflare-dns.com/dns-query',
        https: true,
      },
    },
  ]

  for (const transport of transports) {
    console.log(`\n📡 Testing ${transport.name} Transport:`)
    console.log('----------------------------------------')

    for (const record of recordTypes) {
      try {
        const client = new DnsClient({
          domains: [record.domain],
          type: record.type,
          // Set some sensible defaults
          retries: 2,
          timeout: 5000, // 5 seconds
          ...transport.options,
        })

        console.log(`\nQuerying ${record.type} record for ${record.domain}...`)

        const startTime = Date.now()
        const responses = await client.query()
        const duration = Date.now() - startTime

        const output = formatOutput(responses, {
          json: false,
          short: false,
          showDuration: duration,
          colors: { enabled: true },
          rawSeconds: false,
        })

        console.log(output)

        // Add a small delay between queries to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      catch (err) {
        console.error(`❌ Error querying ${record.domain}: ${(err as Error).message}`)
        // Add a longer delay after errors
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
}

// Run the tests
console.log('🧪 Starting DNS Client Tests...\n')
testDnsClient()
  .then(() => console.log('\n✅ Tests completed!'))
  .catch(err => console.error('\n❌ Test failed:', (err as Error).message))
