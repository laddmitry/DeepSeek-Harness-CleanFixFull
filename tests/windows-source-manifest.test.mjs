import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {lstatSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import test from 'node:test'

const repository = fileURLToPath(new URL('../', import.meta.url))
const script = readFileSync(path.join(repository, 'kit/Freeze-WindowsPermissions.ps1'), 'utf8')
const planner = script.match(/\$planner = @'\r?\n([\s\S]*?)\r?\n'@/)[1]
const manifestText = readFileSync(path.join(repository, 'kit/source-version.json'), 'utf8')
const manifest = JSON.parse(manifestText)
const expectedFiles = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml']

test('reviewed manifest pins the shipped dependency files', () => {
  assert.deepEqual(Object.keys(manifest).sort(), expectedFiles)
  for (const name of expectedFiles) {
    const text = readFileSync(path.join(repository, name), 'utf8').replace(/\r\n/g, '\n')
    assert.equal(createHash('sha256').update(text).digest('hex'), manifest[name], name)
  }
})

function fixture(t, newline = '\n') {
  const parent = realpathSync(tmpdir())
  const root = mkdtempSync(path.join(parent, 'dsh-manifest-'))
  t.after(() => {
    const target = realpathSync(root)
    assert.ok(target.startsWith(parent + path.sep + 'dsh-manifest-') && !lstatSync(root).isSymbolicLink())
    rmSync(target, {recursive: true, force: true})
  })
  for (const name of ['source', 'kit', 'tools', 'data', 'workspace', 'logs']) mkdirSync(path.join(root, name))
  const source = path.join(root, 'source/deepseek-harness-master')
  mkdirSync(source)
  for (const name of expectedFiles) {
    const text = readFileSync(path.join(repository, name), 'utf8').replace(/\r\n/g, '\n')
    writeFileSync(path.join(source, name), text.replace(/\n/g, newline))
  }
  writeFileSync(path.join(root, 'kit/source-version.json'), manifestText)
  return {root, source}
}

function plan(root) {
  return spawnSync(process.execPath, ['-e', planner, root], {encoding: 'utf8', timeout: 30000})
}

for (const [name, newline] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  test(`read-only plan accepts the reviewed ${name} checkout`, t => {
    const {root} = fixture(t, newline)
    const result = plan(root)
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(JSON.parse(result.stdout).sourceHashes, manifest)
  })
}

test('read-only plan rejects dependency content changes', t => {
  const {root, source} = fixture(t)
  writeFileSync(path.join(source, 'package.json'), '{"name":"changed"}\n')
  const result = plan(root)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Source dependency\/configuration version changed/)
})

test('read-only plan rejects a missing manifest', t => {
  const {root} = fixture(t)
  rmSync(path.join(root, 'kit/source-version.json'))
  const result = plan(root)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ENOENT/)
})

test('read-only plan rejects an unreviewed manifest entry', t => {
  const {root} = fixture(t)
  writeFileSync(path.join(root, 'kit/source-version.json'), JSON.stringify({...manifest, 'other.json': '0'.repeat(64)}))
  const result = plan(root)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Invalid reviewed source version manifest/)
})
