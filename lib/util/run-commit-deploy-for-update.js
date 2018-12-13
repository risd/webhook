var async = require( 'async' )
var runInDir = require( './run-in-dir' )

module.exports = runGitCommitDeployForUpdate;

function runGitCommitDeployForUpdate ( options, callback ) {
  var dirName = options.dirName || '.'
  var cloneToDir = options.cloneToDir || '.'
  var userRepo = options.userRepo
  var gitTag = options.gitTag

  var hotfixBranch = `hotfix/${ gitTag }`

  var mergeDeploy = `merge --no-ff ${ hotfixBranch } -m "${ gitTag }" && npm run deploy`
  var mergeDeployMaster = `${ mergeDeploy } && git push origin master`
  var mergeDeployDevelop = `${ mergeDeploy } && git push origin develop`

  console.log( 'mergeDeployMaster' )
  console.log( mergeDeployMaster )

  async.series( [
    runInDir.bind( null, 'npm', cloneToDir, [ 'install' ] ),
    runInDir.bind( null, 'git', cloneToDir, [ 'add', '.' ] ),
    runInDir.bind( null, 'git', cloneToDir, [ 'commit', '-m', `${ gitTag.replace( / /g, ' ' ) }` ] ),
    runInDir.bind( null, 'git', cloneToDir, [ 'checkout', 'master' ] ),
    runInDir.bind( null, 'git', cloneToDir, mergeDeployMaster.split( ' ' ) ),
    runInDir.bind( null, 'git', cloneToDir, [ 'tag', '-a', `"${ gitTag }"`, '-m', hotfixBranch ] ),
    runInDir.bind( null, 'git', cloneToDir, [ 'push', '--tags' ] ),
    runInDir.bind( null, 'git', cloneToDir, [ 'checkout', 'develop' ] ),
    runInDir.bind( null, 'git', cloneToDir, mergeDeployDevelop.split( ' ' ) ),
    runInDir.bind( null, 'git', cloneToDir, [ 'branch', '-d', hotfixBranch ] ),
  ], callback )
}
