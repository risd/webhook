const { default: inquirer } = require("inquirer")
var async = require("async")

async.series([confirm, input, password], function () {
  console.log("done")
})

function confirm(step) {
  inquirer
    .prompt({
      type: "confirm",
      name: "confirm",
      message: "This may modify your package.json file. Proceed?",
    })
    .then(function (answer) {
      if (answer.confirm) {
        console.log("confirm:true")
      } else {
        console.log("confirm:false")
      }
      step()
    })
}

function input(step) {
  inquirer
    .prompt({
      type: "input",
      name: "username",
      message: "Enter email:",
    })
    .then(function (answer) {
      console.log(`input:${answer.username}`)
      step()
    })
}

function password(step) {
  inquirer
    .prompt({
      type: "password",
      name: "password",
      message: "Enter password:",
    })
    .then(function (answer) {
      console.log(`password:${answer.password}`)
      step()
    })
}
