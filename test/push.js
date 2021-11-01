const test = require( 'tape' )
const push = require( '../lib/push.js' )
const env = require( './env.js' )()

test( 'push-without-error', function ( t ) {
  t.plan( 1 )

  const pushOptions = Object.assign( {}, env.push, {
    branch: 'webhook-test',
    skipBuild: 'true',
    http: false,
    dirName: './test/fake-site',
  } )

  push( pushOptions, function onPush ( error ) {
    t.notOk( error, 'finishes without error' )
  } )
} )
