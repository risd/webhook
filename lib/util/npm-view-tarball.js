var parseNpmViewOutput = require("./npm-view-output-parse")
var runInDir = require("./run-in-dir")

module.exports = npmViewTarball

async function npmViewTarball({ package, cwd = "." }) {
  const output = await runInDir("npm", ["view", package, "dist.tarball"], {
    cwd,
  })
  return parseNpmViewOutput(output)
}
