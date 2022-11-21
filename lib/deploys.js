const Deploys = require("webhook-deploy-configuration")

const Firebase = require("./util/firebase/index")
const ensureSiteNameAndKeyExist = require("./util/ensure-site-name-and-key-exist")
const getUserLoginInformation = require("./util/get-user-login-information")
const firebaseLoginUser = require("./util/firebase/login-user")

const gitBranch = require("./util/git-branch")
const unescapeSite = require("./util/unescape-site.js")

/**
 * Get/set/remove deploys
 *
 * @param  {object}   options?               No options gets the deploy configuration
 * @param  {string}   options?.branch?       The branch to address when removing or adding a bucket
 * @param  {string}   options?.bucketSet?    The bucket to set
 * @param  {string}   options?.bucketRemove? The bucket to remove
 * @param  {object} deployConfig  { deploys: [{ bucket, branch }] }
 */
async function DeployConfiguration(options) {
  var firebase = Firebase(options)

  // get config is the default
  var config = {
    cwd: options.cwd || process.cwd(),
    siteName: options.siteName || null,
    siteKey: options.siteKey || null,
    webhookUsername: options.email ? options.email.toLowerCase() : null,
    webhookPassword: options.password,
    branch: options.branch || gitBranch(),
    platformName: options.platformName || "webhook",
    firebaseName: options.firebaseName || "webhook",
    firebaseAPIKey: options.firebaseAPIKey,
    firebase: firebase,
  }

  var deploys = Deploys(firebase.databaseRef())

  await ensureSiteNameAndKeyExist(config)

  if (config.webhookUsername && config.webhookPassword) {
    config.webhookEscapedUsername = escape(config.webhookUsername)
  } else {
    const { username, password } = await getUserLoginInformation(config)
    config.webhookUsername = username
    config.webhookEscapedUsername = escape(config.webhookUsername)
    config.webhookPassword = password
  }

  if (!firebase.currentUser()) {
    await firebaseLoginUser({
      firebase,
      userEmail: config.webhookUsername,
      userPassword: config.webhookPassword,
    })
  }

  const baseDeployOptions = {
    siteName: unescapeSite(config.siteName),
    key: config.siteKey,
  }

  if (options.bucketSet) {
    const setterOptions = {
      ...baseDeployOptions,
      deploy: {
        branch: config.branch,
        bucket: options.bucketSet,
      },
    }
    return await deploys.setBucket(setterOptions)
  } else if (options.bucketRemove) {
    const removeOptions = {
      ...baseDeployOptions,
      bucket: options.bucketRemove,
    }
    return await deploys.removeBucket(removeOptions)
  } else {
    return await deploys.get(baseDeployOptions)
  }

  // Determine series of steps for Set, Remove, or Get deploy configuration
  if (options.bucketSet) {
    config.bucketName = options.bucketSet
    var series = baseSeries.concat(authSeries).concat([setDeployConfiguration])
  } else if (options.bucketRemove) {
    config.bucketName = options.bucketRemove
    var series = baseSeries
      .concat(authSeries)
      .concat([removeDeployConfiguration])
  } else {
    var series = baseSeries.concat([getDeployConfiguration])
  }
}

DeployConfiguration.cliLogSuccess = ({ deploys }) => {
  console.log("Deploys:\n---")
  deploys.forEach(function displayDeployConfiguration(deploy) {
    console.log("URL & bucket: " + deploy.bucket)
    console.log("Git branch:   " + deploy.branch)
    console.log("---")
  })
  process.exit(0)
}

DeployConfiguration.cliLogError = (error) => {
  console.log(error)
  process.exit(1)
}

module.exports = DeployConfiguration
