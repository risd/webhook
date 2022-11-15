var async = require( 'async' )
var runInDir = require( './run-in-dir' )

module.exports = runGitInit;

async function runGitInit (options={}) {
  const cmdOptions = { cwd: options.cwd || '.' }
  await runInDir('git', ['init'], cmdOptions)
  await runInDir('git', ['add', '.'], cmdOptions)
  await runInDir('git', [ 'commit', '-m', '"initial"' ], cmdOptions)
}
