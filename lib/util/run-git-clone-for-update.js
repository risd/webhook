const debug = require('debug')('util-run-git-clone-for-update')
var runInDir = require( './run-in-dir' )

module.exports = runGitCloneForUpdate;

async function runGitCloneForUpdate ({
  cwd='.',
  cloneToDir='.',
  userRepo,
  gitTag,
  throwError=false,
  git='git',
}={}) {
  try {
    await runInDir(
      git,
      ['clone', `git@github.com:${ userRepo }.git`, cloneToDir],
      { cwd })
    await runInDir(git, ['checkout', 'master'], { cwd: cloneToDir })
    await runInDir(git, ['checkout', '--track', 'origin/master'], { cwd: cloneToDir })
    await runInDir(git, ['checkout', '-b', `hotfix/${ gitTag }`, 'master'], { cwd: cloneToDir })
  }
  catch (error) {
    if (throwError) {
      throw error
    }
    else {
      debug(error)
    }
  }
}
