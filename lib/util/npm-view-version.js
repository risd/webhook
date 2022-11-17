var parseNpmViewOutput = require( './npm-view-output-parse' )
var runInDir = require( './run-in-dir' )

module.exports = npmViewVersion;

async function npmViewVersion ({ package, cwd='.' }) {
  const output = await runInDir('npm', [ 'view', package, 'version' ], { cwd })
  return parseNpmViewOutput(output)
}
