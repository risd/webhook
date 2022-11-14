const test = require( 'tape' )
const create = require( '../lib/create.js' )
const env = require( './env.js' )()

test('create-without-error', async function (t) {
  t.plan(1)

  const options = {
    ...env.push,
    dirName: './test/fake-site',
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
