const debug = require("debug")("util-firebase-login-user")
var escapeEmail = require("../escape-site.js")
var {
  ERROR_FIREBASE_AUTH_WRONG_PASSWORD,
  ERROR_FIREBASE_AUTH_USER_NOT_FOUND,
} = require("../../errors.js")

module.exports = firebaseLoginUser

function firebaseLoginUser({ firebase, userEmail, userPassword }) {
  return firebase
    .login({ email: userEmail, password: userPassword })
    .catch((error) => {
      switch (error.code) {
        case "auth/wrong-password":
          error.code = ERROR_FIREBASE_AUTH_WRONG_PASSWORD
          break
        case "auth/user-not-found":
          error.code = ERROR_FIREBASE_AUTH_USER_NOT_FOUND
          break
      }
      throw error
    })
}
