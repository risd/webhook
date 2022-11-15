process.env.DEBUG = '*'
const test = require( 'tape' )
const path = require('path')
const create = require( '../lib/create.js' )
const env = require( './env.js' )()
Error['stackTraceLimit'] = Infinity;

test.onFinish(process.exit)

test('create-without-error', async function (t) {
  t.plan(1)

  const siteName = `wh-automated-test-${(new Date()).toISOString().replace(/:/g, '-').replace(/\./g, '-')}.${env.create.platformDomain}`

  const options = {
    ...env.create,
    cwd: path.join(process.cwd(), 'test'),
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
