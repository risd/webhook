const test = require( 'tape' )

const deployArchive = require( '../lib/util/deploy-archive.js' )

const fs = require( 'fs' )
const path = require( 'path' )

const filesToArchive = [
  'Gruntfile.js',
  'package.json',
  'libs/generate.js'
]
const archiveDirectory = path.join( 'test', 'fake-site' )
const deployArchivePath = path.join( archiveDirectory, '.push.zip' )

test( 'archive-without-error', function ( t ) {
  t.plan( 1 )

  const createOptions = {
    cwd: archiveDirectory,
    files: filesToArchive,
    archivePath: deployArchivePath,
  }

  deployArchive.create( createOptions )
    .then( function () {
      t.ok( true, 'finished without error' )
    } )
    .catch( function ( error ) {
      t.notOk( error, 'failed with error' )
    } )
} )
