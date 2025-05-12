# Complex DNS Record Types

This section covers advanced DNS record types and their usage patterns.

## CAA (Certification Authority Authorization)

CAA records specify which Certificate Authorities are allowed to issue certificates:

```ts
const caaResponse = await client.query({
  name: 'example.com',
  type: 'CAA'
})

interface CAARecord {
  flags: number // Record flags
  tag: string // 'issue', 'issuewild', or 'iodef'
  value: string // CA domain or reporting URL
}

// Example usage
const caaRecords = caaResponse.answers.map(answer => answer.data as CAARecord)
caaRecords.forEach((record) => {
  if (record.tag === 'issue') {
    console.log(`Allowed CA: ${record.value}`)
  }
})
```

## SRV (Service) Records

SRV records define the location of services:

```ts
const srvResponse = await client.query({
  name: '_http._tcp.example.com',
  type: 'SRV'
})

interface SRVRecord {
  priority: number // Priority of target host (lower is higher priority)
  weight: number // Relative weight for records with same priority
  port: number // TCP/UDP port number
  target: string // Hostname of the target machine
}

// Example usage with sorting
const srvRecords = srvResponse.answers
  .map(answer => answer.data as SRVRecord)
  .sort((a, b) => {
    if (a.priority !== b.priority)
      return a.priority - b.priority
    return b.weight - a.weight
  })
```

## TLSA (TLS Authentication)

TLSA records associate TLS certificates with domain names:

```ts
const tlsaResponse = await client.query({
  name: '_443._tcp.example.com',
  type: 'TLSA'
})

interface TLSARecord {
  certUsage: number // Certificate usage (0-3)
  selector: number // Certificate data type (0-1)
  matchingType: number // Matching type (0-2)
  certificateData: string // Certificate association data
}

// Example validation
const tlsaRecords = tlsaResponse.answers.map(answer => answer.data as TLSARecord)
tlsaRecords.forEach((record) => {
  switch (record.certUsage) {
    case 0: // PKIX-TA
      console.log('Trust anchor certificate')
      break
    case 1: // PKIX-EE
      console.log('End entity certificate')
      break
    case 2: // DANE-TA
      console.log('Trust anchor public key')
      break
    case 3: // DANE-EE
      console.log('End entity public key')
      break
  }
})
```

## NAPTR (Naming Authority Pointer)

NAPTR records are used for ENUM and other advanced DNS applications:

```ts
const naptrResponse = await client.query({
  name: 'example.com',
  type: 'NAPTR'
})

interface NAPTRRecord {
  order: number // Processing order
  preference: number // Processing preference
  flags: string // Record flags
  service: string // Service type
  regexp: string // Regular expression
  replacement: string // Replacement pattern
}

// Example ENUM lookup
const naptrRecords = naptrResponse.answers
  .map(answer => answer.data as NAPTRRecord)
  .sort((a, b) => {
    if (a.order !== b.order)
      return a.order - b.order
    return a.preference - b.preference
  })
```

## SSHFP (SSH Fingerprint)

SSHFP records store SSH public key fingerprints:

```ts
const sshfpResponse = await client.query({
  name: 'example.com',
  type: 'SSHFP'
})

interface SSHFPRecord {
  algorithm: number // SSH key algorithm
  fpType: number // Fingerprint type
  fingerprint: string // Key fingerprint
}

// Example validation
const sshfpRecords = sshfpResponse.answers.map(answer => answer.data as SSHFPRecord)
sshfpRecords.forEach((record) => {
  const algo = record.algorithm === 1
    ? 'RSA'
    : record.algorithm === 2
      ? 'DSA'
      : record.algorithm === 3
        ? 'ECDSA'
        : record.algorithm === 4 ? 'Ed25519' : 'Unknown'
  console.log(`${algo} key fingerprint: ${record.fingerprint}`)
})
```

## Working with Multiple Record Types

Example of querying multiple record types:

```ts
const multiResponse = await client.query({
  name: 'example.com',
  type: ['A', 'AAAA', 'MX', 'TXT', 'CAA']
})

interface MultiQueryResult {
  a: string[]
  aaaa: string[]
  mx: Array<{ preference: number, exchange: string }>
  txt: string[][]
  caa: CAARecord[]
}

const result: MultiQueryResult = {
  a: multiResponse.answers
    .filter(r => r.type === 'A')
    .map(r => r.data as string),
  aaaa: multiResponse.answers
    .filter(r => r.type === 'AAAA')
    .map(r => r.data as string),
  mx: multiResponse.answers
    .filter(r => r.type === 'MX')
    .map(r => r.data as { preference: number, exchange: string }),
  txt: multiResponse.answers
    .filter(r => r.type === 'TXT')
    .map(r => r.data as string[]),
  caa: multiResponse.answers
    .filter(r => r.type === 'CAA')
    .map(r => r.data as CAARecord)
}
```
