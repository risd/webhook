var path = require("path")
var Deploys = require("webhook-deploy-configuration")

var Firebase = require("./util/firebase/index")
var ensureSiteNameAndKeyExist = require("./util/ensure-site-name-and-key-exist")

var unescape = require("./util/unescape-site")
var gitBranch = require("./util/git-branch")
var runBuild = require("./util/run-build")
var siteDir = require("./util/site-dir")

/**
 * Use deploy configuration to determine where to push files.
 *
 * @param  {object}   options
 * @param  {Function} callback
 */
async function DeployStatic(options) {
  const firebase = Firebase(options)

  const config = {
    cwd: options.cwd || process.cwd(),
    siteName: options.siteName,
    siteKey: null,
    staticPrefix: options.staticPrefix,
    staticFolder: options.staticFolder,
    gcloud: options.gcloud,
    debug: options.debug,
    branch: options.branch,
  }

  const deploys = Deploys(firebase.databaseRef())

  await ensureSiteNameAndKeyExist(config)

  var staticFolder = StaticFolder({
    folderPath: config.staticFolder,
    cwd: config.cwd,
  })
  if (staticFolder.shouldBuild()) {
    await runBuild({ options: { cwd: config.cwd } })
  }

  let deployBuckets = []
  if (config.siteName) {
    deployBuckets = [unescape(config.siteName)]
  } else {
    const deployConfiguration = await deploys.get({
      siteName: unescape(config.siteName),
      key: config.siteKey,
    })

    const branch = config.branch || gitBranch()
    deployBuckets = deployConfiguration.deploys
      .filter((deploy) => deploy.branch === branch)
      .map((deploy) => unescape(deploy.bucket))
  }

  const pushers = deployBuckets.map((bucket) => {
    const pusherOpt = {
      siteName: bucket,
      directory: staticFolder.is(),
      directoryPrefix: config.staticPrefix,
      keyFile: config.gcloud,
      debug: config.debug,
    }
    return siteDir.asPromise(pusherOpt)
  })

  await Promise.all(pushers)
}

function StaticFolder({ cwd, folderPath }) {
  var runBuildProcess = false

  if (!folderPath) {
    var defaultBuildFolder = path.join(cwd, ".build")
    folderPath = defaultBuildFolder
    runBuildProcess = true
  }

  return {
    is: function () {
      return folderPath
    },
    shouldBuild: function () {
      return runBuildProcess
    },
  }
}

DeployStatic.cliLogError = () => {
  console.log(error)
}

module.exports = DeployStatic
