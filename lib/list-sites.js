var Firebase = require("./util/firebase/index")
var getUserLoginInformation = require("./util/get-user-login-information")
var firebaseLoginUser = require("./util/firebase/login-user")

var unescape = require("./util/unescape-site")

async function ListSites(options) {
  var firebase = Firebase(options)

  var config = {
    platformName: options.platformName || "webhook",
    webhookUsername: options.email ? options.email.toLowerCase() : "",
    webhookPassword: options.password,
    firebaseName: options.firebaseName || "webhook",
    firebaseAPIKey: options.firebaseAPIKey,
    firebase: firebase,
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
    await firebaseLoginUser({
      firebase,
      userEmail: config.webhookUsername,
      userPassword: config.webhookPassword,
    })
  }

  const userSitesSnapshot = await firebase.userSites(config.webhookUsername)
  const userSites = userSitesSnapshot.val()
  return { userSites }
}

ListSites.cliLogSuccess = ({ userSites }) => {
  require("colors")
  if (userSites.owners) {
    console.log(`The ${program.platformName} sites I'm an owner of:`.green)
    for (var site in userSites.owners) {
      console.log(unescape(site))
    }
  }
  if (userSites.users) {
    console.log(`The ${program.platformName} sites I\'m a user of:`.blue)
    for (var site in userSites.users) {
      console.log(unescape(site))
    }
  }
  if (!userSites.users && !userSites.owners) {
    console.log(
      `Not an owner or user for any site on ${program.platformName}`.red
    )
  }
}

ListSites.cliLogError = (error) => {
  console.log(error)
}

module.exports = ListSites
