const test = require( 'tape' )
const downloadGenerate = require( '../lib/util/download-generate.js' )
const generateExtract = require( '../lib/util/generate-extract.js' )
const env = require( './env.js' )()

const fs = require( 'fs' )
const path = require( 'path' )
const testDir = path.join(process.cwd(), 'test')
const extractToPath = path.join(testDir, 'package' )
const extractedPackagePath = path.join( extractToPath, 'package.json' )
const generatePath = path.join(testDir, '.generate-repo.tgz' )

fs.mkdirSync( extractToPath, { recursive: true } )

test.onFinish( function () {
  fs.unlinkSync( generatePath )
  fs.rmSync( extractToPath, {
    recursive: true,
    force: true,
  } )
} )

test( 'download-generate:success', async function ( t ) {
  t.plan( 1 )

  try {
    const fileName = await downloadGenerate({ packageOrUrl: env.downloadGenerate.generate, cwd: testDir })
    t.ok( typeof fileName === 'string', 'finish with generate file name' )
  }
  catch (error) {
    t.fail( error, 'finish without error' )
  }
} )

test( 'download-generate:failure', async function ( t ) {
  t.plan( 1 )
  try {
    const fileName = await downloadGenerate({ packageOrUrl: '--bad-npm-package-name--', cwd: testDir })
    t.fail( typeof fileName === 'string', 'bad npm package name succeded when it shouldh have failed' )
  }
  catch (error) {
    t.ok( error, 'finishes with error as expected' )
  }
} )

test( 'generate-extract', function ( t ) {
  t.plan( 2 )

  generateExtract( {
    generatePath,
    cwd: extractToPath,
  } )
    .on( 'error', function ( error ) {
      t.notOk( error, 'could not extract generate' )
      t.end( error )
    } )
    .on( 'finish', function () {
      t.ok( true, 'finished extracting generate' )

      try {
        fs.accessSync( extractedPackagePath, fs.constants.F_OK )
        t.ok( true, 'package.json in extracted generate is accessable' )
      }
      catch ( error ) {
        t.notOk( error, 'could not access package.json in extracted generate' )
      }
    } ) 
} )
