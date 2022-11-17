var runInDir = require("./run-in-dir")

module.exports = runNpmInstall

function runNpmInstall({ npm = "npm", cwd = "." } = {}) {
  return runInDir(npm, ["install"], { cwd })
}
