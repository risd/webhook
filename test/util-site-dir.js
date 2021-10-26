const test = require( 'tape' )
const siteDir = require( '../lib/util/site-dir.js' )
const unescapeSite = require( '../lib/util/unescape-site.js' )
const env = require( './env.js' )()

env.utilSiteDir.siteName = unescapeSite( env.utilSiteDir.siteName )

test( 'push-without-error', function ( t ) {
  t.plan( 1 )

  const pushOptions = Object.assign( {}, env.utilSiteDir, {
    directory: './test/assets',
  } )

  siteDir( pushOptions, function onPush ( error ) {
    t.notOk( error, 'finishes without error' )
  } )
} )
