process.env.DEBUG = '*'
const test = require( 'tape' )
const path = require('node:path')
const fs = require('node:fs')
const create = require('../lib/create.js')
const init = require('../lib/init.js')
const create = require('../lib/conf.js')
const deploys = require('../lib/deploys.js')
const github = require('../lib/github.js')
const backup = require('../lib/preset-build')
const restore = require('../lib/restore')
const deployStatic = require('../lib/deploy-static.js')
const pushStatic = require('../lib/push-static.js')
const update = require('../lib/update.js')
const env = require('./env.js')()

const siteName = `wh-automated-test-${(new Date()).toISOString().replace(/:/g, '-').replace(/\./g, '-')}.${env.create.platformDomain}`
const siteParentDir = path.join(process.cwd(), 'test')
const absSitePath = path.join(cwd, siteName)

test.onFinish(process.exit)

test('create-without-error', async (t) => {
  t.plan(1)
  const options = {
    ...env.create,
    cwd: siteParentDir,
    siteName,
  }

  try {
    await create(options)
    t.ok(true)
  }
  catch (error) {
    console.log(error)
    t.fail(error)
  }
})

test('init-without-error', async (t) => {
  t.plan(1)
  const options = {
    ...env.init,
    cwd: absSitePath,
    siteName,
  }

  try {
    await init(options)
    t.ok(true)
  }
  catch (error) {
    console.log(error)
    t.fail(error)
  }
})

test('conf-without-error', async (t) => {
  t.plan(1)

  const options = {
    ...env.conf,
    cwd: absSitePath,
    siteName,
  }

  try {
    await conf(options)
    t.ok(true)
  }
  catch(error) {
    console.log(error)
    t.fail(error)
  }
})

test('github-without-error', (t) => {
  const setSptions = {
    ...env.conf,
    cwd: absSitePath,
    siteName,
    gitSet: 'user/repo',
  }

  try {
    const { github }  = await github(setSptions)
    t.ok(github === setSptions.gitSet, 'Set github configuration')
  }
  catch (error) {
    console.log(error)
    t.fail(error, 'Failed to set github configuration')
  }

  const getOptions = {
    ...env.conf,
    cwd: absSitePath,
    siteName,
  }

  try {
    const { github } = await github(getOptions)
    t.ok(github === setSptions.gitSet, 'Got github configuration')
  }
  catch (error) {
    t.fail(error, 'Failed to get github configuration')
  }

  const removeOptions = {
    ...env.conf,
    cwd: absSitePath,
    siteName,
    gitRemove: true,
  }

  try {
    await github(removeOptions)
    t.ok(true, 'Removed github configuration')
  }
  catch (error) {
    console.log(error)
    t.fail(error, 'Failed to remove github configuration')
  }

  const getDeploysOptions = {
    ...env.deploys,
    cwd: absSitePath,
    siteName,
  }

  const expectedDefaultDeploys = [{
    bucket: siteName,
    branch: 'master',
  }]

  try {
    const defaultDeployConfiguration = await deploys.DeployConfiguration(getDeploysOptions)
    t.deepEqual(defaultDeployConfiguration.deploys, expectedDefaultDeploys, 'Sets default deploy configuration.')
  }
  catch (error) {
    console.log(error)
    t.fail(error, 'Failed to set default deploy configuration.')
  }

  t.end()
})

test('backup-and-restore', async (t) => {
  try {
    const backupFile = path.join(absSitePath, 'backup.json')
    const backupOptions = {
      ...env.backup,
      siteName,
      cwd: absSitePath,
      toFile: backupFile,
      all: true,
    }

    await backup(backupOptions)
    t.ok(true, 'Successfully backed up site.')

    const restoreOptions = {
      ...env.restore,
      siteName,
      cwd: absSitePath,
      fromFile: backupFile,
    }

    const { updated } = await restore(restoreOptions)
    t.ok(updated.data, 'Successfully restored site from backup.')
  }
  catch (error) {
    console.log(error)
    t.fail(error, 'Faield to backup and restore')
  }

  t.end()
})

test('push-static', async (t) => {
  t.plan(1)

  try {
    const options = {
      ...env.pushStatic,
      domain: siteName,
    }

    await deployStatic(options)
    t.ok(true, 'Pushed static site successfully')
  }
  catch (error) {
    console.log(error)
    t.fail(error, 'Faield to push static site')
  }
})

test('update', async (t) => {
  t.plan(1)

  try {
    const options = {
      ...env.update,
      siteName,
      cwd: absSitePath,
      force: true,
    }

    await update(options)
    t.ok(true, 'Successfully updated site')
  }
  catch (error) {
    console.log(error)
    t.fail(error, 'Failed to update site')
  }
})

