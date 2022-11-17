const debug = require("debug")("util-fs-parse-json")
const fs = require("node:fs")

module.exports = fsParseJson

function fsParseJson(path) {
  if (path.startsWith("~")) {
    path = `${getUserHome()}${path.slice(1)}`
  }
  debug("parse path: ", path)
  return JSON.parse(fs.readFileSync(path).toString())
}

function getUserHome() {
  return process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]
}
