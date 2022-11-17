const runInDir = require( './run-in-dir' )
const runNpmInstall = require('./run-npm-install')

module.exports = runGitCommitDeployForUpdate;

async function runGitCommitDeployForUpdate ({
  cwd='.',
  cloneToDir='.',
  userRepo,
  gitTag,
  throwError=false,
  git='git',
  npm='npm',
}={}) {
  const hotfixBranch = `hotfix/${ gitTag }`

  const mergeArgs = `merge --no-ff ${ hotfixBranch } -m "${ gitTag }"`.split( ' ' )
  const npmRunDeployArgs = 'run deploy'.split(' ')

  try {
    await runNpmInstall({ cwd: cloneToDir })
    await runInDir(git, ['add', '.'], { cwd: cloneToDir })
    await runInDir(git, ['commit', '-m', `"${ gitTag }"`], { cwd: cloneToDir })
    await runInDir(git, ['checkout', 'develop'], { cwd: cloneToDir })
    await runInDir(git, ['checkout', '--track', 'origin/develop'], { cwd: cloneToDir })
    await runInDir(git, mergeArgs, { cwd: cloneToDir })
    await runInDir(npm, npmRunDeployArgs, { cwd: cloneToDir })
    await runInDir(git, ['push', 'origin', 'develop'], { cwd: cloneToDir })
    await runInDir(git, ['checkout', 'master'], { cwd: cloneToDir })
    await runInDir(git, mergeArgs, { cwd: cloneToDir })
    await runInDir(npm, npmRunDeployArgs, { cwd: cloneToDir })
    await runInDir(git, ['push', 'origin', 'master'], { cwd: cloneToDir })
    await runInDir(git, ['tag', '-a', `"${ gitTag }"`, '-m', hotfixBranch], { cwd: cloneToDir })
    await runInDir(git, ['branch', '-d', hotfixBranch], { cwd: cloneToDir })
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
