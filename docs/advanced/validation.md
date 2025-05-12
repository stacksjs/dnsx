# DNS Validation

This section covers advanced validation features and error handling in the DNS client.

## Input Validation

### Domain Name Validation

```ts
const client = new DnsClient({
  validation: {
    domainNames: {
      maxLength: 255,
      allowUnicode: true,
      strictMode: true
    }
  }
})

// Example with validation
try {
  await client.query({
    name: 'example.com',
    validate: true // Enable additional validation
  })
}
catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message)
    console.error('Field:', error.field)
    console.error('Value:', error.value)
  }
}
```

### Record Data Validation

```ts
interface ValidationOptions {
  records: {
    // A records
    a: {
      allowPrivateIP: boolean
      allowLoopback: boolean
    }
    // MX records
    mx: {
      requireValidHostname: boolean
      maxPreference: number
    }
    // TXT records
    txt: {
      maxLength: number
      allowMultipleStrings: boolean
    }
  }
}

const client = new DnsClient({
  validation: {
    records: {
      a: {
        allowPrivateIP: false,
        allowLoopback: false
      },
      mx: {
        requireValidHostname: true,
        maxPreference: 65535
      },
      txt: {
        maxLength: 255,
        allowMultipleStrings: true
      }
    }
  }
})
```

## Response Validation

### TTL Validation

```ts
const client = new DnsClient({
  validation: {
    ttl: {
      min: 60, // Minimum TTL in seconds
      max: 86400, // Maximum TTL in seconds
      enforce: true // Enforce TTL limits
    }
  }
})

// Example usage
try {
  const response = await client.query({
    name: 'example.com',
    type: 'A',
    validateTTL: true
  })
}
catch (error) {
  if (error instanceof TTLValidationError) {
    console.error('TTL validation failed:', error.message)
    console.error('Record:', error.record)
    console.error('TTL:', error.ttl)
  }
}
```

### Response Size Validation

```ts
const client = new DnsClient({
  validation: {
    response: {
      maxSize: 512, // Maximum response size in bytes
      truncationStrategy: 'tc' // 'tc' or 'error'
    }
  }
})

// Example with size validation
try {
  const response = await client.query({
    name: 'example.com',
    type: 'ANY',
    validateSize: true
  })

  if (response.flags.truncated) {
    console.log('Response was truncated')
    console.log('Original size:', response.metadata.originalSize)
    console.log('Truncated size:', response.metadata.size)
  }
}
catch (error) {
  if (error instanceof ResponseSizeError) {
    console.error('Response too large:', error.message)
    console.error('Size:', error.size)
    console.error('Limit:', error.limit)
  }
}
```

## Custom Validation

### Custom Validators

```ts
interface CustomValidator {
  name: string
  validate: (query: DnsQuery, response: DnsResponse) => Promise<boolean>
  onError?: (error: Error) => void
}

const client = new DnsClient({
  validation: {
    custom: [
      {
        name: 'customValidator',
        validate: async (query, response) => {
          // Custom validation logic
          if (response.answers.length === 0) {
            throw new Error('Empty response not allowed')
          }

          // Check for specific record types
          const hasRequiredRecords = response.answers.some(
            record => ['A', 'AAAA'].includes(record.type)
          )
          if (!hasRequiredRecords) {
            throw new Error('Missing required record types')
          }

          return true
        },
        onError: (error) => {
          console.error('Custom validation failed:', error.message)
        }
      }
    ]
  }
})
```

### Validation Chain

Example of chaining multiple validators:

```ts
const client = new DnsClient({
  validation: {
    chain: [
      // Domain name validation
      {
        name: 'domainValidator',
        validate: async (query) => {
          if (!isValidDomain(query.name)) {
            throw new ValidationError('Invalid domain name')
          }
          return true
        }
      },
      // Response validation
      {
        name: 'responseValidator',
        validate: async (_, response) => {
          if (response.rcode !== 0) {
            throw new ValidationError('Non-zero response code')
          }
          return true
        }
      },
      // Custom business logic
      {
        name: 'businessValidator',
        validate: async (query, response) => {
          // Add your business-specific validation rules
          return true
        }
      }
    ]
  }
})

// Using the validation chain
try {
  const response = await client.query({
    name: 'example.com',
    type: 'A',
    runValidationChain: true
  })
}
catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation chain failed:', error.message)
    console.error('Validator:', error.validatorName)
    console.error('Stage:', error.validationStage)
  }
}
```
