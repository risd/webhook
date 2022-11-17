var Firebase = require("./util/firebase/index")
var getUserLoginInformation = require("./util/get-user-login-information")
var firebaseLoginUser = require("./util/firebase/login-user")
var ensureSiteNameAndKeyExist = require("./util/ensure-site-name-and-key-exist")

/**
 * Send domain mapping signal to the server
 *
 * @param  {object}   options
 * @param  {Function} callback
 */
module.exports = async function MapDomain(options) {
  var firebase = Firebase(options)

  var config = {
    cwd: options.cwd || process.cwd(),
    platformName: options.platformName || "webhook",
    siteName: options.siteName || null,
    siteKey: options.siteKey || null,
    webhookUsername: options.webhookUsername || null,
    webhookPassword: options.password,
    maskDomain: options.maskDomain,
    contentDomain: options.contentDomain,
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

  await firebase.siteMapDomain(config)
  return
}
