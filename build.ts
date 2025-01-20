import { dts } from 'bun-plugin-dtsx'

console.log('Building...')
const startTime = performance.now()

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: 'esm',
  target: 'node',
  plugins: [dts()],
})

const endTime = performance.now()
const buildTime = (endTime - startTime).toFixed(2)

console.log(`Built in ${buildTime}ms`)
