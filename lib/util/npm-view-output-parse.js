const errors = require("../errors")

module.exports = npmViewOutputParse

function npmViewOutputParse(output) {
  if (output) {
    try {
      return findValue(output.toString())
    } catch (error) {
      error.code = errors.ERROR_NPM_OUTPUT_PARSE_ERROR
      throw error
    }
  } else {
    const error = new Error("Could not capture output.")
    error.code = errors.ERROR_NPM_OUTPUT_PARSE_ERROR
    throw error
  }
}

function findValue(output) {
  var lines = output.trim().split("\n")
  if (lines.length === 1) return lines[0]

  lines = lines.filter(doesNotstartsWithSpaces).filter(isNotEmpty)

  var latest = lines[lines.length - 1]
  var latestUrl = latest.split(" ")[1]
  return latestUrl.slice(1, -1)
}

function doesNotstartsWithSpaces(line) {
  return !line.startsWith("  ")
}

function isNotEmpty(line) {
  return line.length > 0
}
