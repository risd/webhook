var debug = require( 'debug' )( 'git-branch' )

module.exports = gitBranch;


function gitBranch () {
  try {
    var branch = require( 'git-state' ).branchSync()
    debug( branch )
    return branch;
  }
  catch ( noGitError ) {
    debug( `Error getting git repo branch` )
    throw new Error( 'Must be within a git repository.' )
  }
}
