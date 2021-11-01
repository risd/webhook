const fs = require( 'fs' )
const path = require( 'path' )
const archiver = require( 'archiver' )

module.exports.create = createArchive
module.exports.extract = extractArchive

function createArchive ( options ) {
  var archivePath = options.archivePath
  if ( ! archivePath ) throw new Error( 'must pass file path to archive to' )
  var files = options.files
  if ( ! files ) throw new Error( 'must pass files to archive' )
  var cwd = options.cwd || '.'

console.log( archivePath )
console.log( files )
console.log( cwd )

  return new Promise( function ( resolve, reject ) {
    var zipFile = new archiver.create( 'zip' )

    var output = fs.createWriteStream( archivePath )
    zipFile.pipe(output);

    zipFile.on( 'error', function ( error ) {
      throw error
    } )

    output.on( 'close', function () {
      resolve()
    } )

    files.map( function toFileSpec ( file ) {
        return {
          archivePath: file,
          localPath: path.join( cwd, file ),
        }
      } )
      .forEach( function addToArchive ( fileSpec ) {
        zipFile.file( fileSpec.localPath, { name:  fileSpec.archivePath } )
      } )

    zipFile.finalize()
  } )
}

function extractArchive () {

}
