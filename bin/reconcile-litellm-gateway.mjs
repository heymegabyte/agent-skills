#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const desired = JSON.parse(readFileSync(path.join(root, 'config/litellm/gateway-desired-state.json'), 'utf8'))
const run = (command, args) => execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 }).trim()
const secret = (name) => run('get-secret', [name])
const http = async (url, { token, headers = {}, method = 'GET', body, redirect = 'follow', timeout = 20_000 } = {}) => {
  const response = await fetch(url, {
    method,
    redirect,
    signal: AbortSignal.timeout(timeout),
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  return { response, text: await response.text() }
}

for (const name of desired.secrets.required) assert(secret(name).length > 0, `required secret is missing: ${name}`)
const callerKey = secret('LITELLM_API_KEY')
const masterKey = secret('LITELLM_MASTER_KEY')

const healthResult = await http(`${desired.service.endpoint}/health/readiness`)
assert.equal(healthResult.response.status, 200)
const health = JSON.parse(healthResult.text)
assert.equal(health.status, 'healthy', 'gateway readiness is not healthy')
assert.equal(health.db, 'connected', 'gateway database is not connected')

const modelsResult = await http(`${desired.service.endpoint}/v1/models`, { token: callerKey })
assert.equal(modelsResult.response.status, 200)
const models = JSON.parse(modelsResult.text).data.map((item) => item.id)
for (const model of desired.routes.required) assert(models.includes(model), `missing advertised route: ${model}`)

const localSmoke = await http(`${desired.service.endpoint}/v1/chat/completions`, { token: callerKey, method: 'POST', headers: { 'content-type': 'application/json' }, body: { model: desired.routes.local.alias, messages: [{ role: 'user', content: 'Reply with exactly OK' }], max_tokens: 8, temperature: 0 }, timeout: 180_000 })
assert.equal(localSmoke.response.status, 200, `local inference smoke failed: ${localSmoke.text.slice(0, 160)}`)
assert(JSON.parse(localSmoke.text).choices?.length > 0, 'local inference returned no choice')

const liveImage = run('ssh', ['ssh-coolify.megabyte.space', "sudo docker inspect litellm-l1fxqlugpg7iyt9mnoxogwqz --format '{{index .RepoDigests 0}}' 2>/dev/null || sudo docker inspect litellm-l1fxqlugpg7iyt9mnoxogwqz --format '{{.Image}}'"])
const expectedDigest = desired.service.image.split('@')[1]
const imageId = run('ssh', ['ssh-coolify.megabyte.space', "sudo docker inspect litellm-l1fxqlugpg7iyt9mnoxogwqz --format '{{.Image}}'"])
const expectedImageId = run('ssh', ['ssh-coolify.megabyte.space', `sudo docker image inspect '${desired.service.image}' --format '{{.Id}}'`])
assert.equal(imageId, expectedImageId, `live image drifted from ${expectedDigest}; observed ${liveImage}`)

const saltCount = Number(run('ssh', ['ssh-coolify.megabyte.space', "sudo docker inspect litellm-l1fxqlugpg7iyt9mnoxogwqz | jq '[.[0].Config.Env[] | select(startswith(\"LITELLM_SALT_KEY=\"))] | length'"]))
assert.equal(saltCount, 1, 'runtime salt is missing or duplicated')
assert.equal((await http(`${desired.service.endpoint}/v1/models`)).response.status, 401, 'unauthenticated API behavior drifted')

const keyInfoResult = await http(`${desired.service.endpoint}/key/info?key=${encodeURIComponent(callerKey)}`, { token: masterKey })
assert.equal(keyInfoResult.response.status, 200)
const keyInfo = JSON.parse(keyInfoResult.text).info
const policy = desired.callerPolicy
assert.equal(keyInfo.key_alias, policy.keyAlias)
assert.deepEqual([...keyInfo.models].sort(), [...desired.routes.required].sort())
assert.equal(keyInfo.max_budget, policy.maxBudgetUsd)
assert.equal(keyInfo.budget_duration, policy.budgetDuration)
assert.equal(keyInfo.rpm_limit, policy.rpmLimit)
assert.equal(keyInfo.tpm_limit, policy.tpmLimit)
assert.equal(keyInfo.max_parallel_requests, policy.maxParallelRequests)
assert.deepEqual(keyInfo.allowed_routes, policy.allowedRoutes)
const deniedAdmin = await http(`${desired.service.endpoint}/key/generate`, { token: callerKey, method: 'POST', headers: { 'content-type': 'application/json' }, body: {} })
assert.equal(deniedAdmin.response.status, 403, 'caller key can access an administrative route')
assert.equal((await http(`${desired.service.endpoint}/metrics`)).response.status, 401, 'metrics no longer require authentication')

const cfEmail = secret('CLOUDFLARE_EMAIL')
const cfKey = secret('CLOUDFLARE_API_KEY')
const cfAccount = secret('CLOUDFLARE_ACCOUNT_ID')
const cfHeaders = { 'X-Auth-Email': cfEmail, 'X-Auth-Key': cfKey }
const accessApps = JSON.parse((await http(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/access/apps`, { headers: cfHeaders })).text)
const accessApp = accessApps.result.find((item) => item.domain === desired.access.cloudflareAccessPaths[0])
assert(accessApp, 'LiteLLM UI Cloudflare Access application is missing')
const policies = JSON.parse((await http(`https://api.cloudflare.com/client/v4/accounts/${cfAccount}/access/apps/${accessApp.id}/policies`, { headers: cfHeaders })).text)
assert(policies.result.some((item) => item.decision === 'allow'), 'LiteLLM UI Access application has no allow policy')

const target = JSON.parse(run('ssh', ['ssh-coolify.megabyte.space', "curl -fsS http://127.0.0.1:9090/api/v1/targets | jq -c '.data.activeTargets[] | select(.labels.job==\"litellm\" and .scrapeUrl==\"http://litellm:4000/metrics\") | {health,lastError}'"]))
assert.equal(target.health, 'up', `private Prometheus target is not up: ${target.lastError}`)

console.log(JSON.stringify({ status: 'ok', release: desired.service.release, routes: desired.routes.required, access: 'protected', metrics: 'up' }))
