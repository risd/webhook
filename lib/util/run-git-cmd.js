var runInDir = require( './run-in-dir' )
var exitCodeIsNotError = require( './run-in-dir' ).exitCodeIsNotError

module.exports = runGitCmd;

function runGitCmd ( options ) {
  var userRepo = options.userRepo;
  var dirName = options.dirName;

  var git = 'git'

  return gitInCloneDir;

  function gitInCloneDir ( args, continueOnError ) {
    if ( ! continueOnError ) continueOnError = false;

    return function gitStep ( step ) {
      runInDir( git, dirName, args, handleGitCmd )  
    
      function handleGitCmd ( exitCode ) {
        if ( exitCodeIsNotError( exitCode ) ) {
          step( null )
        }
        else if ( continueOnError ) {
          step( null )
        }
        else {
          var errorMessage = `
            Failed to: git ${ args.join( ' ' ) }
            for user repo: ${ userRepo }
            in directory: ${ dirName }`

          step( new Error( errorMessage ) )
        }
      }
    }
  }
}
