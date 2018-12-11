var parseNpmViewOutput = require( './npm-view-output-parse' )
var runInDir = require( './run-in-dir' )

module.exports = npmViewTarball;

function npmViewTarball ( optionsOrPackage, step ) {
  if ( typeof optionsOrPackage === 'string' ) {
    var options = {
      package: optionsOrPackage,
      cwd: '.'
    }
  }

  var handleOutput = parseNpmViewOutput( step )

  runInDir( 'npm', options.cwd, [ 'view', options.package, 'dist.tarball' ], true, handleOutput )
}
