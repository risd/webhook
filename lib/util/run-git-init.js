var async = require( 'async' )
var runInDir = require( './run-in-dir' )

module.exports = runGitInit;

function runGitInit (options={}) {
  const dirName = options.dirName || '.'
  const cmdOptions = { cwd: dirName }
  await runInDir('git', ['init'], cmdOptions)
  await runInDir('git', ['add', '.'], cmdOptions)
  await runInDir('git', [ 'commit', '-m', '"initial"' ], cmdOptions)
}
