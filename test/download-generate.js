const test = require( 'tape' )
const downloadGenerate = require( '../lib/util/download-generate.js' )
const env = require( './env.js' )()

test( 'download-generate:success', function ( t ) {
  t.plan( 3 )

  downloadGenerate( env.downloadGenerate.generate, handleDownload )

  function handleDownload ( error, fileName ) {
    t.notOk( error, 'finish without error' )
    t.ok( typeof fileName === 'string', 'finish with generate file name' )

    require( 'fs' ).unlinkSync(
      require( 'path' )
        .join( process.cwd(), '.generate-repo.tgz' ) )

    t.ok( true, 'removed generate file' )
  }
} )

test( 'download-generate:failure', function ( t ) {
  t.plan( 1 )

  downloadGenerate( '--bad-npm-package-name--', handleDownload )

  function handleDownload ( error ) {
    t.ok( error, 'finishes with error' )
  }
} )
