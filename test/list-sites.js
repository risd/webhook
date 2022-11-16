const test = require( 'tape' )
const listSites = require( '../lib/list-sites.js' )
const env = require( './env.js' )()

test.onFinish(process.exit)

test('push-without-error-module', async function (t) {
  t.plan(1)

  const options = {
    ...env.listSites,
  }

  try {
    const { userSites } = await listSites(options)
    console.log(userSites)
    t.ok(true)
  }
  catch (error) {
    t.fail(error)
  }
} )
