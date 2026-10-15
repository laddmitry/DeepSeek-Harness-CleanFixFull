import {existsSync} from 'node:fs'
import path from 'node:path'

// Source checkouts and deployed runtime closures expose different entry locations.
export function resolveHarnessPaths(sourceRoot) {
  const first = (relativePaths) => {
    for (const relative of relativePaths) {
      const entry = path.join(sourceRoot, relative)
      if (existsSync(entry)) return entry
    }
    throw new Error('Build Harness from source before verification: ' + sourceRoot)
  }
  return {
    cli: first(['apps/cli/lib/bin.js', 'lib/bin.js', 'node_modules/@deepseek-ai/dsh/lib/bin.js']),
    sdk: first(['packages/sdk/client/lib/index.js', 'node_modules/@deepseek-ai/dsh-sdk-client/lib/index.js']),
  }
}
