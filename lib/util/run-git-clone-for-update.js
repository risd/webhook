var async = require( 'async' )
var runInDir = require( './run-in-dir' )

module.exports = runGitCloneForUpdate;

function runGitCloneForUpdate ( options, callback ) {
  var dirName = options.dirName || '.'
  var cloneToDir = options.cloneToDir || '.'
  var userRepo = options.userRepo
  var gitTag = options.gitTag

  async.series( [
    runInDir.bind( null, 'git', dirName, [ 'clone', `git@github.com:${ userRepo }.git`, cloneToDir ], true ),
    runInDir.bind( null, 'git', cloneToDir, [ 'checkout', '-b', `hotfix/${ gitTag }`, 'master' ], true ),
  ], callback )
}
