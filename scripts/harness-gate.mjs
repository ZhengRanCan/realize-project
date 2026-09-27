import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = resolve(rootDir, process.env.HARNESS_FEATURE_LIST ?? 'docs/harness/features/feature-index.json')
const statuses = new Set(['not_started', 'active', 'blocked', 'passing'])
const errors = []

function fail(message) {
  errors.push(message)
}

function parseValue(value) {
  try { return JSON.parse(value) } catch { return value.replace(/^['"]|['"]$/g, '') }
}

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  return Object.fromEntries(match[1].split('\n').flatMap((line) => {
    const i = line.indexOf(':')
    return i < 1 ? [] : [[line.slice(0, i).trim(), parseValue(line.slice(i + 1).trim())]]
  }))
}

function array(value) { return Array.isArray(value) ? value : [] }
function commandPassed(evidence) { return array(evidence?.commands).some((entry) => entry?.result === 'passed') }
// Line-based scan: the upstream template's lookahead `(?=^## |\s*$)` matches an empty section
// right after the heading, so it never sees the checkboxes. See docs/decisions.md (2026-09-27).
function acceptance(markdown) {
  const lines = markdown.split('\n')
  const start = lines.findIndex((line) => /^##\s+Acceptance Criteria\s*$/.test(line))
  if (start < 0) return []
  const body = []
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break
    body.push(line)
  }
  return body.flatMap((line) => {
    const match = line.match(/^[-*]\s+\[([ xX])\]\s+\S/)
    return match ? [match[1].toLowerCase() === 'x'] : []
  })
}

function loadFeature(entry) {
  const label = entry?.id ?? 'unknown'
  for (const key of ['id', 'title', 'status', 'feature_folder', 'version']) {
    if (typeof entry?.[key] !== 'string' || entry[key].length === 0) fail(`${label}: index entry needs ${key}.`)
  }
  if (!statuses.has(entry?.status)) fail(`${label}: invalid status "${entry?.status}".`)
  const folder = resolve(rootDir, entry.feature_folder ?? '')
  const file = resolve(folder, 'feature.md')
  if (!existsSync(file)) { fail(`${label}: missing feature.md.`); return null }
  const verification = resolve(folder, 'verification.md')
  if (!existsSync(verification)) fail(`${label}: missing verification.md.`)
  const markdown = readFileSync(file, 'utf8')
  const feature = { ...entry, ...frontmatter(markdown), acceptance: acceptance(markdown) }
  if (feature.id !== entry.id) fail(`${label}: contract id does not match index.`)
  if (feature.status !== entry.status) fail(`${label}: contract status does not match index.`)
  return feature
}

function validate(feature, all) {
  if (!feature) return
  const label = feature.id
  if (!array(feature.dependsOn)) fail(`${label}: dependsOn must be an array.`)
  if (!feature.scope || typeof feature.scope !== 'object') fail(`${label}: scope must be an object.`)
  if (!feature.evidence || typeof feature.evidence !== 'object') fail(`${label}: evidence must be an object.`)
  const gate = feature.completionGate
  if (!gate || typeof gate !== 'object') { fail(`${label}: completionGate must be an object.`); return }
  for (const key of ['userPath', 'integrationEvidence', 'knownUnverified', 'humanReviewRequired']) {
    if (!array(gate[key])) fail(`${label}: completionGate.${key} must be an array.`)
  }
  if (!['required', 'not_required'].includes(gate.l3)) fail(`${label}: completionGate.l3 is invalid.`)
  for (const dependency of array(feature.dependsOn)) {
    const parent = all.find((item) => item?.id === dependency)
    if (!parent) fail(`${label}: missing dependency ${dependency}.`)
    else if (['active', 'passing'].includes(feature.status) && parent.status !== 'passing') fail(`${label}: dependency ${dependency} must be passing.`)
  }
  if (feature.status !== 'passing') return
  if (!feature.evidence?.lastVerifiedAt) fail(`${label}: passing feature needs evidence.lastVerifiedAt.`)
  if (!commandPassed(feature.evidence)) fail(`${label}: passing feature needs a passed command.`)
  if (!feature.acceptance.length) fail(`${label}: passing feature needs acceptance criteria.`)
  if (feature.acceptance.some((checked) => !checked)) fail(`${label}: all acceptance criteria must be checked before passing.`)
  if (array(gate.knownUnverified).length) fail(`${label}: passing feature cannot have knownUnverified items.`)
  if (array(gate.humanReviewRequired).length) fail(`${label}: passing feature cannot have pending human review.`)
  if (gate.l3 === 'required' && !array(gate.integrationEvidence).length && !String(feature.evidence?.manualSmoke ?? '').trim()) fail(`${label}: L3 requires integration or manual-path evidence.`)
}

let entries = []
try {
  entries = JSON.parse(readFileSync(indexPath, 'utf8'))
  if (!Array.isArray(entries)) fail('feature-index.json must be an array.')
} catch (error) { fail(`Cannot read feature index: ${error.message}`) }

const features = Array.isArray(entries) ? entries.map(loadFeature) : []
if (features.filter((feature) => feature?.status === 'active').length > 1) fail('Only one active feature is allowed.')
const ids = new Set()
for (const feature of features) {
  if (feature && ids.has(feature.id)) fail(`${feature.id}: duplicate feature id.`)
  if (feature) ids.add(feature.id)
}
for (const feature of features) validate(feature, features)

console.log(`Harness gate: ${features.filter(Boolean).length} features, ${errors.length} errors.`)
for (const error of errors) console.error(`- ${error}`)
if (errors.length) process.exit(1)
