const fs = require( 'fs' )
const tar = require( 'tar' )
const path = require( 'path' )

module.exports.create = createArchive
module.exports.extract = extractArchive

function createArchive ( options ) {
  var archivePath = options.archivePath
  if ( ! archivePath ) throw new Error( 'must pass file path to archive to' )
  var files = options.files
  if ( ! files ) throw new Error( 'must pass files to archive' )
  var cwd = options.cwd || '.'

  return tar.create( {
    gzip: true,
    file: archivePath,
    cwd: cwd,
  }, files )
}

function extractArchive ( options ) {
  var archivePath = options.archivePath
  if ( ! archivePath ) throw new Error( 'must pass file path to extract' )
  var cwd = options.cwd || '.'
  
  return tar.extract( {
    file: archivePath,
    cwd: cwd,
  } )
}
