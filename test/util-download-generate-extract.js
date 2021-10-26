const test = require( 'tape' )
const downloadGenerate = require( '../lib/util/download-generate.js' )
const generateExtract = require( '../lib/util/generate-extract.js' )
const env = require( './env.js' )()

const path = require( 'path' )
const extractToPath = path.join( process.cwd(), 'package' )
const generatePath = path.join( process.cwd(), '.generate-repo.tgz' )

test.onFinish( function () {
  require( 'fs' ).unlinkSync( generatePath )
} )

test( 'download-generate:success', function ( t ) {
  t.plan( 2 )

  downloadGenerate( env.downloadGenerate.generate, handleDownload )

  function handleDownload ( error, fileName ) {
    t.notOk( error, 'finish without error' )
    t.ok( typeof fileName === 'string', 'finish with generate file name' )
  }
} )

test( 'download-generate:failure', function ( t ) {
  t.plan( 1 )

  downloadGenerate( '--bad-npm-package-name--', handleDownload )

  function handleDownload ( error ) {
    t.ok( error, 'finishes with error' )
  }
} )

test( 'generate-extract', function ( t ) {
  t.plan( 1 )

  generateExtract( {
    generatePath,
    cwd: extractToPath,
  } )
    .on( 'error', function ( error ) {
      t.notOk( error, 'could not extract generate' )
    } )
    .on( 'finish', function () {
      t.ok( true, 'finished extracting generate' )
    } ) 
} )
