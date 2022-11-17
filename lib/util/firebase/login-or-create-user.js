const inquirer = require("inquirer")
const firebaseLoginUser = require("./login-user.js")
const firebaseErrors = require("./errors.js")
const errors = require("../../errors")

module.exports = firebaseLoginOrCreateUser

/**
 * Login or create user.
 *
 * @param  {object} config
 * @param  {object} config.firebase        Initialized firebase interface
 * @param  {object} config.webhookUsername User email to login or create
 * @param  {object} config.webhookPassword User password
 */
async function firebaseLoginOrCreateUser({
  firebase,
  userEmail,
  userPassword,
  webhookCreateUserProgrammatically = false,
}) {
  function promptSecondPassword() {
    return inquirer
      .prompt({
        type: "password",
        name: "password",
        message: "Re-enter your password:",
      })
      .then(function (answer) {
        if (answer.password !== "" && answer.password === userPassword) {
          return
        } else if (answer.password.trim() === "") {
          console.log(
            "========================================================".red
          )
          console.log(
            "# No second password entered, please re-enter          #".red
          )
          console.log(
            "========================================================".red
          )
          return promptSecondPassword()
        } else {
          const error = new Error("Passwords do not match.")
          error.code = errors.ERROR_MISMATCHING_PASSWPRDS
          throw error
        }
      })
  }

  try {
    await firebaseLoginUser({ firebase, userEmail, userPassword })
    return
  } catch (error) {
    if (
      error.code === errors.ERROR_FIREBASE_AUTH_USER_NOT_FOUND &&
      webhookCreateUserProgrammatically === true &&
      userEmail &&
      userPassword
    ) {
      await firebaseCreateUser()
      return
    } else if (
      error.code === errors.ERROR_FIREBASE_AUTH_USER_NOT_FOUND &&
      userEmail &&
      userPassword
    ) {
      console.log("To create an account, please type your password again.".blue)
      await promptSecondPassword()
      await firebaseCreateUser()
      return
    } else {
      throw error
    }
  }

  async function firebaseCreateUser() {
    try {
      await firebase.createUser({ email: userEmail, password: userPassword })
    } catch (error) {
      if (error.code === firebaseErrors.AUTH_WEAK_PASSWORD) {
        error.code = errors.ERROR_FIREBASE_AUTH_WEAK_PASSWORD
      }
      throw error
    }
    return
  }
}
