const debug = require("debug")("init")

const Firebase = require("./util/firebase/index")
const getUserLoginInformation = require("./util/get-user-login-information")
const firebaseLoginOrCreateUser = require("./util/firebase/login-or-create-user")
const firebaseRetrieveSiteKey = require("./util/firebase/retrieve-site-key")

const escapeSite = require("./util/escape-site")
const runNpmInstall = require("./util/run-npm-install")
const runGruntInit = require("./util/run-grunt-init")

module.exports = async function Init(options) {
  var firebase = Firebase(options)

  var config = {
    cwd: options.cwd || process.cwd(),
    platformName: options.platformName || "webhook",
    siteName: escapeSite(options.siteName),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : "",
    webhookEscapedUsername: "",
    webhookPassword: options.password,
    webhookCreateUserProgrammatically:
      options.createUserProgrammatically || false,
    server: options.server,
    firebaseName: options.firebaseName || "webhook",
    firebaseAPIKey: options.firebaseAPIKey,
    firebase: firebase,
    imgix_host: options.imgix_host || null,
    imgix_secret: options.imgix_secret || null,
  }

  if (config.webhookUsername && config.webhookPassword) {
    config.webhookEscapedUsername = escape(config.webhookUsername)
  } else {
    const { username, password } = await getUserLoginInformation(config)
    config.webhookUsername = username
    config.webhookEscapedUsername = escape(config.webhookUsername)
    config.webhookPassword = password
  }

  if (!firebase.currentUser()) {
    await firebaseLoginOrCreateUser({
      firebase,
      userEmail: config.webhookUsername,
      userPassword: config.webhookPassword,
      webhookCreateUserProgrammatically:
        config.webhookCreateUserProgrammatically,
    })
  }

  if (!config.siteKey) {
    config.siteKey = await firebaseRetrieveSiteKey(config)
  }

  debug("Running initialization...")

  await runNpmInstall({ cwd: config.cwd })
  await runGruntInit({
    ...options,
    ...config,
  })
}
