const debug = require("debug")("conf")

const Firebase = require("./util/firebase/index")
const getUserLoginInformation = require("./util/get-user-login-information")
const firebaseLoginUser = require("./util/firebase/login-user")
const firebaseRetrieveSiteKey = require("./util/firebase/retrieve-site-key")

const escape = require("./util/escape-site")
const runGruntInit = require("./util/run-grunt-init")

async function Conf(options) {
  var firebase = Firebase(options)

  var config = {
    cwd: options.cwd || process.cwd(),
    platformName: options.platformName || "webhook",
    siteName: escape(options.siteName),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : "",
    webhookEscapedUsername: "",
    webhookPassword: options.password,
    firebaseName: options.firebaseName || "webhook",
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  if (config.webhookUsername && config.webhookPassword) {
    config.webhookEscapedUsername = escape(config.webhookUsername)
  } else {
    const { username, password } = await getUserLoginInformation()
    config.webhookUsername = username
    config.webhookEscapedUsername = escape(config.webhookUsername)
    config.webhookPassword = password
  }

  debug("firebase-login")

  await firebaseLoginUser({
    firebase,
    userEmail: config.webhookUsername,
    userPassword: config.webhookPassword,
  })
  if (!config.siteKey) {
    config.siteKey = await firebaseRetrieveSiteKey(config)
  }

  debug("run grunt init")

  await runGruntInit({
    ...options,
    ...config,
  })
}

Conf.cliLogSuccess = () => {
  require("colors")
  console.log("Done preparing files.".green)
}
Conf.cliLogError = (error, { platformName }) => {
  switch (error.code) {
    case errors.ERROR_FIREBASE_AUTH_WRONG_PASSWORD:
      console.log(
        "========================================================".red
      )
      console.log(
        "# Password is incorrect                                #".red
      )
      console.log(
        "========================================================".red
      )
      console.log("# Please doublecheck your records.".red)
      console.log(
        `# You can change your by attempting to log into any ${platformName} CMS`
          .yellow
      )
      console.log(
        "# ---------------------------------------------------- #".red
      )
      break
    case errors.ERROR_FIREBASE_AUTH_USER_NOT_FOUND:
      console.log(
        `User not found. Please create a new account running the 'init' or 'create' command with this CLI. Otherwise create an accont on any ${platformName} CMS.`
      )
      break
    default:
      console.log("Error setting up .firebase.conf")
  }
}

module.exports = Conf
