const test = require( 'tape' )
const push = require( '../lib/push.js' )
const env = require( './env.js' )()

test('push-without-error-module', async function (t) {
  t.plan(1)

  const pushOptions = {
    ...env.push,
    branch: 'webhook-test',
    skipBuild: 'true',
    http: false,
    dirName: './test/fake-site',
  }

  try {
    await push(pushOptions)
    t.ok(true)
  }
  catch (error) {
    t.fail(error)
  }
} )
