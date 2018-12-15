var async = require( 'async' )
var runInDir = require( './run-in-dir' )
var gitCmdRunner = require( './run-git-cmd' )

module.exports = runGitCloneForUpdate;

function runGitCloneForUpdate ( options, callback ) {
  var dirName = options.dirName || '.'
  var cloneToDir = options.cloneToDir || '.'
  var userRepo = options.userRepo
  var gitTag = options.gitTag

  var gitInDirName = gitCmdRunner( { dirName: dirName, userRepo: userRepo } )
  var gitInCloneDir = gitCmdRunner( { dirName: cloneToDir, userRepo: userRepo } )
  var continueOnError = true;
  var dieOnError = false;

  async.waterfall( [
    gitInDirName( [ 'clone', `git@github.com:${ userRepo }.git`, cloneToDir ], dieOnError ),
    gitInCloneDir( [ 'checkout', 'master' ], continueOnError ),
    gitInCloneDir( [ 'checkout', '--track', 'origin/master' ], continueOnError ),
    gitInCloneDir( [ 'checkout', '-b', `hotfix/${ gitTag }`, 'master' ], dieOnError ),
  ], callback )
}
