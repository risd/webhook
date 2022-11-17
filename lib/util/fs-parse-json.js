const debug = require("debug")("util-fs-parse-json")
const fs = require("node:fs/promises")

module.exports = fsParseJson

async function fsParseJson(path) {
  if (path.startsWith("~")) {
    path = `${getUserHome()}${path.slice(1)}`
  }
  debug("parse path: ", path)
  const buffer = await fs.readFile(path)
  return JSON.parse(buffer.toString())
}

function getUserHome() {
  return process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]
}
