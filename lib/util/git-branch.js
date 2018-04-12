module.exports = gitBranch;


function gitBranch () {
  try {
    return require( 'git-state' ).branchSync()
  }
  catch ( noGitError ) {
    throw new Error( 'Must be within a git repository.' )
  }
}
