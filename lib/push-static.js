var getGitBranch = require('./util/git-branch')
var siteDir = require('./util/site-dir')

module.exports = async function PushStatic (options={}) {
  var debug = options.debug || false

  options.branch = options.branch || getGitBranch()

  var pushOptions = {
    siteName: makeBranchBasedSiteName(options.baseDomain, options.branch),
    directory: options.staticFolder,
    directoryPrefix: options.staticPrefix,
    gcloud: options.gcloud,
    debug: debug,
  }
  
  await siteDir.asPromise(pushOptions)

  return {
    directory: pushOptions.directory,
    siteName: pushOptions.siteName,
    sitePath: pushOptions.directoryPrefix ? pushOptions.directoryPrefix : '/'
  }
}

function makeBranchBasedSiteName ( domain, branch ) {
  return branch === 'master' || branch === 'main'
    ? domain
    : [ branchAsSubdomain( branch ), domain ].join( '.' )
}

function branchAsSubdomain ( branch ) {
  return branch
    .replace( /^release\//g, '' )   // release/r-15 -> r-15
    .replace( /^feature\//g, 'f-' ) // feature/firebase-upgrade -> f-firebase-upgrade
    .replace( /^hotfix\//g,  'h-' ) // hotfix/template-patch -> h-template-patch
    .replace( /\//g, '-' )          // replace '/' with '-'
    .replace( /\+/g, '-' )          // replace '+' with '-'
}
