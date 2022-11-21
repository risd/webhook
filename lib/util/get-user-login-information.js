const debug = require("debug")("util-get-user-login-information")
var inquirer = require("inquirer")
var escape = require("./escape-site")

module.exports = getUserLoginInformation

function getUserLoginInformation({ platformName }) {
  var username = ""
  var password = ""

  debug("start")

  return new Promise((resolve, reject) => {
    debug("prompt-username")

    function promptPassword() {
      debug("prompt-password")
      return inquirer
        .prompt({
          type: "password",
          name: "password",
          message: "Enter your " + platformName + " password:",
        })
        .then(function (answer) {
          password = answer.password
          if (password.trim() === "") {
            console.log(
              "\n========================================================".red
            )
            console.log(
              "# No password entered, please re-enter                 #".red
            )
            console.log(
              "========================================================".red
            )
            return promptPassword()
          } else {
            resolve({ username, password })
          }
        })
    }

    inquirer
      .prompt({
        type: "input",
        name: "username",
        message: "Enter your " + platformName + " email:",
      })
      .then(function (answer) {
        debug("answer-username")
        username = answer.username

        return promptPassword()
      })
  })
}
