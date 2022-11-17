const glob = require("glob")

module.exports = pglob

function pglob(pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (error, matches) => {
      if (error) return reject(error)
      resolve(matches)
    })
  })
}
