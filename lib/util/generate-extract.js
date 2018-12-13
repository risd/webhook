var tar = require( 'tar' )
var fs = require( 'fs' )

module.exports = generateExtract;

function generateExtract ( options ) {
  var generatePath = options.generatePath
  var cwd = options.cwd
  var filesToExtract = options.filesToExtract
  var extractBasePath = 'package'

  return tarExtract( {
    tarFile: generatePath,
    cwd: cwd,
    extractBasePath: extractBasePath,
    extractFiles: filesToExtract,
  } )
}

function tarExtract ( options ) {
  var tarFile = options.tarFile
  var cwd = options.cwd || '.'
  var extractBasePath = options.extractBasePath || '.'
  var extractFiles = options.extractFiles

  return fs.createReadStream( tarFile )
      .pipe( tar.extract( {
        cwd: cwd,
        filter: filterTar( extractBasePath, extractFiles ),
        strip: 1,
      } ) )
}

// basePath : string, paths: [string] => ( extractPath : string, entry ) => include : boolean
function filterTar ( basePath, paths ) {
  var path = require( 'path' )
  return function tarFilter ( extractPath, entry ) {
    var include = false;
    for (var i = paths.length - 1; i >= 0; i--) {
      var includePath = path.join( basePath, paths[ i ] )
      if ( extractPath.startsWith( includePath ) ) include = true;
    }
    return include;
  }
}
