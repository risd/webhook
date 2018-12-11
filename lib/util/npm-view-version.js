var parseNpmViewOutput = require( './npm-view-output-parse' )
var runInDir = require( './run-in-dir' )

module.exports = npmViewVersion;
module.exports.step = npmViewVersionStep;

function npmViewVersion ( optionsOrPackage, step ) {
  if ( typeof optionsOrPackage === 'string' ) {
    var options = {
      package: optionsOrPackage,
      cwd: '.'
    }
  }

  var handleOutput = parseNpmViewOutput( step )

  runInDir( 'npm', options.cwd, [ 'view', options.package, 'version' ], true, handleOutput ) 
}

function npmViewVersionStep ( configFn, step ) {
  var config = configFn()
  if ( config.generateVersion ) return step()

  npmViewVersion( config.generate, function ( error, generateVersion ) {
    if ( error ) return step( error )
    config.generateVersion = generateVersion;
    step()
  } )
}
