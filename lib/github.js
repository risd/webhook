var Firebase = require("./util/firebase/index")
var ensureSiteNameAndKeyExist = require("./util/ensure-site-name-and-key-exist")
var getUserLoginInformationStep =
  require("./util/get-user-login-information").step
var firebaseLoginUser = require("./util/firebase/login-user")

var unescapeSite = require("./util/unescape-site.js")

/**
 * Get/set/remove github user/repo information.
 *
 * The repo information is used to support updating a site
 * without having a local copy of it.
 *
 * @param  {object}   options
 * @param  {string}   options.gitSet?       The git user/repo string to set for the current site.
 * @param  {string}   options.gitRemove?    Set the user/repo string to null, removing it from firebase.
 */
async function GithubConfiguration(options) {
  var firebase = Firebase(options)

  // get config is the default
  var config = {
    cwd: options.cwd || process.cwd(),
    siteName: options.siteName || null,
    siteKey: options.siteKey || null,
    webhookUsername: options.email ? options.email.toLowerCase() : null,
    webhookPassword: options.password,
    platformName: options.platformName || "webhook",
    firebaseName: options.firebaseName || "webhook",
    firebaseAPIKey: options.firebaseAPIKey,
    firebase: firebase,
  }

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

  if (options.gitSet) {
    await firebase.siteGithub({ siteName: config.siteName }, options.gitSet)
    return { siteName: config.siteName, github: options.gitSet }
  } else if (options.gitRemove) {
    await firebase.siteGithub({ siteName: config.siteName }, null)
    return { siteName: config.siteName }
  } else {
    const githubSnapshot = await firebase.siteGithub({
      siteName: config.siteName,
    })
    const githubSnapshotVal = githubSnapshot.val()
    return { siteName: config.siteName, github: githubSnapshotVal }
  }
}

GithubConfiguration.cliLogSuccessGet = ({ siteName, github }) => {
  console.log(`${siteName} stored on github as ${github}`)
}
GithubConfiguration.cliLogSuccessSet = ({ siteName, github }) => {
  console.log(
    `Successfully set github user/repo configuration for ${siteName} as: ${github}`
  )
}
GithubConfiguration.cliLogSuccessRemove = ({ siteName }) => {
  console.log(`Removed github user/repo configure for ${siteName}`)
}
GithubConfiguration.cliLogError = () => {
  console.log(error)
}

module.exports = GithubConfiguration
