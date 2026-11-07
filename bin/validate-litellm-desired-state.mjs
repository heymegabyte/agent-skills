#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const desired = JSON.parse(await readFile(path.join(root, 'config/litellm/gateway-desired-state.json'), 'utf8'))
const schema = JSON.parse(await readFile(path.join(root, 'config/litellm/gateway-desired-state.schema.json'), 'utf8'))
const ajv = new Ajv2020({ allErrors: true })
ajv.addFormat('uri', /^https:\/\//)
assert(ajv.validate(schema, desired), JSON.stringify(ajv.errors))

assert.equal(desired.schemaVersion, 1)
assert.match(desired.service.image, /@sha256:[a-f0-9]{64}$/)
assert.match(desired.service.rollbackImage, /@sha256:[a-f0-9]{64}$/)
assert(desired.service.deniedReleases.includes('1.107.0'))
assert(!desired.service.image.includes('1.107.0'))
assert.equal(desired.secrets.valuesCommitted, false)
assert(desired.secrets.required.includes('LITELLM_SALT_KEY'))
assert(desired.routes.required.includes(desired.routes.local.alias))
assert.equal(desired.routes.local.apiBase, 'http://ollama:11434')
assert(desired.callerPolicy.maxParallelRequests > 0)
assert(desired.callerPolicy.maxBudgetUsd > 0)
assert(desired.callerPolicy.rpmLimit > 0)
assert(desired.callerPolicy.tpmLimit > 0)
assert(desired.callerPolicy.allowedRoutes.every((route) => !route.includes('/key/')))
assert(desired.access.cloudflareAccessPaths.every((route) => route.includes('/ui/')))

const awarenessFiles = ['AGENTS.md', 'CLAUDE.md', 'CODEX.md', 'GEMINI.md', 'rules/agent-provider-policy.md', 'rules/litellm-gateway.md']
for (const relative of awarenessFiles) {
  const text = await readFile(path.join(root, relative), 'utf8')
  assert.match(text, /OpenCode/i, `${relative} must activate OpenCode`)
  assert.match(text, /LiteLLM/i, `${relative} must activate LiteLLM`)
  assert.match(text, /Ollama/i, `${relative} must activate local Ollama awareness`)
}

console.log('LiteLLM desired state and cross-harness awareness are valid')
