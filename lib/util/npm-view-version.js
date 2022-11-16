var parseNpmViewOutput = require( './npm-view-output-parse' )
var runInDir = require( './run-in-dir' )

module.exports = npmViewVersion;

function npmViewVersion ({ package, cwd='.' }) {
  const output = await runInDir('npm', [ 'view', package, 'version' ], { cwd })
  return parseNpmViewOutput(output)
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
