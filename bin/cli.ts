import type { CAC } from 'cac'
import type { DnsOptions } from '../src/types'
import process from 'node:process'
import { cac } from 'cac'
import pc from 'picocolors'
import { version } from '../package.json'
import { DnsClient } from '../src/client'
import { formatOutput } from '../src/output'

interface Colors {
  error: (str: string) => string
  warning: (str: string) => string
  success: (str: string) => string
  info: (str: string) => string
  dim: (str: string) => string
}

// Color helper
export const colors: Colors = {
  error: (str: string) => pc.red(str),
  warning: (str: string) => pc.yellow(str),
  success: (str: string) => pc.green(str),
  info: (str: string) => pc.blue(str),
  dim: (str: string) => pc.dim(str),
}

const cli: CAC = cac('dnsx')

// Define CLI options
cli
  .command('[...domains]', 'Perform DNS lookup for specified domains')
  .option('-q, --query <HOST>', 'Host name or domain name to query')
  .option('-t, --type <TYPE>', 'Type of the DNS record being queried (A, MX, NS...)')
  .option('-n, --nameserver <ADDR>', 'Address of the nameserver to send packets to')
  .option('--class <CLASS>', 'Network class of DNS record (IN, CH, HS)')
  .option('--edns <SETTING>', 'Whether to OPT in to EDNS (disable, hide, show)')
  .option('--txid <NUMBER>', 'Set transaction ID to specific value')
  .option('-Z <TWEAKS>', 'Set uncommon protocol tweaks')
  .option('-U, --udp', 'Use DNS over UDP', { default: false })
  .option('-T, --tcp', 'Use DNS over TCP', { default: false })
  .option('-S, --tls', 'Use DNS-over-TLS', { default: false })
  .option('-H, --https', 'Use DNS-over-HTTPS', { default: false })
  .option('-1, --short', 'Display nothing but first result', { default: false })
  .option('-J, --json', 'Display output as JSON', { default: false })
  .option('--color <WHEN>', 'When to colorize output (always, auto, never)')
  .option('--seconds', 'Display durations in seconds', { default: false })
  .option('--time', 'Print response time', { default: false })
  .example('dnsx example.com')
  .example('dnsx example.com MX')
  .example('dnsx example.com MX @1.1.1.1')
  .example('dnsx example.com -t MX -n 1.1.1.1 -T')
  .action(async (domains: string[], options: DnsOptions) => {
    try {
      // Handle domains from both arguments and --query option
      const allDomains = [
        ...domains,
        ...(Array.isArray(options.query) ? options.query : options.query ? [options.query] : []),
      ]

      // Check if we have any domains to query
      if (allDomains.length === 0) {
        console.log()
        console.log(colors.info('  Usage Examples:'))
        console.log()
        console.log('    $ dnsx example.com')
        console.log('    $ dnsx example.com MX')
        console.log('    $ dnsx example.com MX @1.1.1.1')
        console.log('    $ dnsx -q example.com -t MX -n 1.1.1.1 -T')
        console.log()
        console.log(`  Run ${colors.info('dnsx --help')} for detailed usage`)
        console.log()
        process.exit(1)
      }

      // Create client with direct options
      const client = new DnsClient({
        domains: allDomains,
        nameserver: options.nameserver,
        type: options.type,
        class: options.class,
        udp: options.udp,
        tcp: options.tcp,
        tls: options.tls,
        https: options.https,
        edns: options.edns,
        txid: options.txid,
        tweaks: options.Z,
      })

      console.log(colors.dim('  Querying DNS records...'))

      const startTime = Date.now()
      const responses = await client.query()
      const duration = Date.now() - startTime

      const output = formatOutput(responses, {
        json: options.json,
        short: options.short,
        showDuration: options.time ? duration : undefined,
        colors: {
          enabled: options.color === 'always'
            || (options.color !== 'never' && process.stdout.isTTY),
        },
        rawSeconds: options.seconds,
      })

      console.log()
      console.log(output)

      // Exit with error if no responses
      if (responses.length === 0) {
        process.exit(1)
      }
    }
    catch (err: any) {
      console.error()
      console.error(colors.error(`  Error: ${err.message}`))
      console.error()
      process.exit(1)
    }
  })

cli.help()
cli.version(version)

// Handle errors
cli.on('error', (err) => {
  console.error()
  console.error(colors.error(`  Error: ${err.message}`))
  console.error()
  process.exit(1)
})
