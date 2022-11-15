process.env.DEBUG = '*'
const test = require( 'tape' )
const path = require('node:path')
const fs = require('node:fs')
const create = require('../lib/create.js')
const init = require('../lib/init.js')
const create = require('../lib/conf.js')
const env = require('./env.js')()

const siteName = `wh-automated-test-${(new Date()).toISOString().replace(/:/g, '-').replace(/\./g, '-')}.${env.create.platformDomain}`
const cwd = path.join(process.cwd(), 'test')
const absSitePath = path.join(cwd, siteName)

test.onFinish(process.exit)

test('create-without-error', async (t) => {
  t.plan(1)
  const options = {
    ...env.create,
    cwd,
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
    cwd,
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

test('conf-without-error', async () => {
  t.plan(1)

  const options = {
    ...env.conf,
    cwd,
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
