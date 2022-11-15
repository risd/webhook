const test = require( 'tape' )
const path = require('path')
const create = require( '../lib/create.js' )
const env = require( './env.js' )()

test('create-without-error', async function (t) {
  t.plan(1)

  process.env.DEBUG = '*'

  const options = {
    ...env.create,
    cwd: path.join(process.cwd(), 'test'),
    siteName: `wh-automated-test-${new Date().toISOString()}`
  }

  try {
    await create(options)
    t.ok(true)
  }
  catch (error) {
    t.fail(error)
  }
} )
