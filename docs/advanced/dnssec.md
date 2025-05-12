# DNSSEC Validation

DNSSEC (DNS Security Extensions) provides authentication and integrity verification for DNS responses.

## Basic Configuration

Enable DNSSEC validation in the client:

```ts
const client = new DnsClient({
  dnssec: {
    enabled: true,
    validateSignatures: true,
    requireSignatures: true
  }
})
```

### DNSSEC Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable DNSSEC processing |
| `validateSignatures` | `boolean` | `true` | Verify DNSSEC signatures |
| `requireSignatures` | `boolean` | `false` | Require DNSSEC for all responses |

## Querying with DNSSEC

Perform queries with DNSSEC validation:

```ts
const response = await client.query({
  name: 'example.com',
  type: 'A',
  dnssec: true
})

// Check DNSSEC status
if (response.flags.authenticData) {
  console.log('Response is DNSSEC validated')

  // Get RRSIG records
  const signatures = response.additional.filter(r => r.type === 'RRSIG')
  console.log('Signatures:', signatures)

  // Get DNSKEY records
  const keys = response.additional.filter(r => r.type === 'DNSKEY')
  console.log('Keys:', keys)
}
```

## DNSSEC Record Types

### RRSIG (Resource Record Signature)

```ts
interface RRSIGRecord {
  typeCovered: string
  algorithm: number
  labels: number
  originalTTL: number
  signatureExpiration: Date
  signatureInception: Date
  keyTag: number
  signerName: string
  signature: string
}
```

### DNSKEY (DNS Public Key)

```ts
interface DNSKEYRecord {
  flags: number
  protocol: number
  algorithm: number
  publicKey: string
}
```

### DS (Delegation Signer)

```ts
interface DSRecord {
  keyTag: number
  algorithm: number
  digestType: number
  digest: string
}
```

## Validation Process

Example of custom validation process:

```ts
const client = new DnsClient({
  dnssec: {
    enabled: true,
    validateSignatures: true,
    validationCallback: async (response, keys) => {
      // Custom validation logic
      for (const sig of response.signatures) {
        const key = keys.find(k => k.keyTag === sig.keyTag)
        if (!key) {
          throw new DnssecError('Missing DNSKEY record')
        }

        // Verify signature
        const isValid = await verifySignature(response.records, sig, key)
        if (!isValid) {
          throw new DnssecError('Invalid signature')
        }
      }
      return true
    }
  }
})
```

## Error Handling

Handle DNSSEC-specific errors:

```ts
try {
  const response = await client.query({
    name: 'example.com',
    type: 'A',
    dnssec: true
  })
}
catch (error) {
  if (error instanceof DnssecError) {
    console.error('DNSSEC validation failed:', error.message)
    console.error('Signature:', error.signature)

    if (error.code === 'EXPIRED') {
      console.error('Signature expired at:', error.signature.signatureExpiration)
    }
    else if (error.code === 'MISSING_KEY') {
      console.error('Missing DNSKEY for tag:', error.keyTag)
    }
    else if (error.code === 'INVALID_SIG') {
      console.error('Invalid signature for:', error.signature.signerName)
    }
  }
}
```

## Chain of Trust

Example of validating the DNSSEC chain of trust:

```ts
const client = new DnsClient({
  dnssec: {
    enabled: true,
    validateChain: true,
    trustAnchors: [
      // Root trust anchors
      {
        name: '.',
        type: 'DS',
        keyTag: 20326,
        algorithm: 8,
        digestType: 2,
        digest: '...'
      }
    ]
  }
})
```
