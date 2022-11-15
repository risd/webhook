process.env.DEBUG = '*'
const test = require( 'tape' )
const path = require('node:path')
const fs = require('node:fs')
const create = require('../lib/create.js')
const init = require('../lib/init.js')
const create = require('../lib/conf.js')
const github = require('../lib/github.js')
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
  t.plan(3)

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
    t.fail(error, 'Failed to remove github configuration')
  }
})
