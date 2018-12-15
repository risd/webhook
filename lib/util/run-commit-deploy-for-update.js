var async = require( 'async' )
var gitCmdRunner = require( './run-git-cmd' )
var runInDir = require( './run-in-dir' )
var exitCodeIsNotError = require( './run-in-dir' ).exitCodeIsNotError


module.exports = runGitCommitDeployForUpdate;

function runGitCommitDeployForUpdate ( options, callback ) {
  var dirName = options.dirName || '.'
  var cloneToDir = options.cloneToDir || '.'
  var userRepo = options.userRepo
  var gitTag = options.gitTag

  var hotfixBranch = `hotfix/${ gitTag }`

  var mergeArgs = `merge --no-ff ${ hotfixBranch } -m "${ gitTag }"`.split( ' ' )
  var pushMasterArgs = `push origin master`.split( ' ' )
  var pushDevelopArgs = `push origin develop`.split( ' ' )

  var npmInCloneDir = npmInDir( cloneToDir )
  var gitInCloneDir = gitCmdRunner( { dirName: cloneToDir, userRepo: userRepo } )
  var continueOnError = true;
  var dieOnError = false;

  async.waterfall( [
    npmInCloneDir( [ 'install' ] ),
    gitInCloneDir( [ 'add', '.' ], dieOnError ),
    gitInCloneDir( [ 'commit', '-m', `${ gitTag.replace( / /g, ' ' ) }` ], dieOnError ),
    gitInCloneDir( [ 'checkout', 'master' ], dieOnError ),
    gitInCloneDir( mergeArgs, dieOnError ),
    npmInCloneDir( [ 'run', 'deploy' ], dieOnError ),
    gitInCloneDir( pushMasterArgs, dieOnError ),
    gitInCloneDir( [ 'tag', '-a', `"${ gitTag }"`, '-m', hotfixBranch ], dieOnError ),
    gitInCloneDir( [ 'push', '--tags' ], continueOnError ),
    gitInCloneDir( [ 'checkout', 'develop' ], continueOnError ),
    gitInCloneDir( [ 'checkout', '--track', 'origin/develop' ], continueOnError ),
    gitInCloneDir( mergeArgs, dieOnError ),
    npmInCloneDir( [ 'run', 'deploy' ], dieOnError ),
    gitInCloneDir( pushDevelopArgs, dieOnError ),
    gitInCloneDir( [ 'branch', '-d', hotfixBranch ], dieOnError ),
  ], callback )
}

function npmInDir ( dirName) {
  return function npmQueuer ( args, continueOnError ) {
    if ( ! continueOnError ) continueOnError = false
    
    return function npmStep ( step ) {
      runInDir( 'npm', dirName, args, handleNpmCmd )

      function handleNpmCmd ( exitCode ) {
        if ( exitCodeIsNotError( exitCode ) ) {
          step( null )
        }
        else if ( continueOnError ) {
          step( null )
        }
        else {
          step( new Error( `
            Failed to run npm ${ args.join( ' ') }
            in directory: ${ dirName }` ) )
        }
      }
    }
  }
}
