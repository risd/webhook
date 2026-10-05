const debug = require("debug")("cdn-purge")
var async = require("async")

module.exports = CDNPurge

function CDNPurge(fileUrl, complete) {
  // fileUrl includes protocol
  if (fileUrl.startsWith("http")) {
    // only a single purge result will come back, so we ensure
    // its wrapped in an array to match the signature of
    // when the input is a protocol-less url
    return purge(fileUrl, function (error, result) {
      complete(error, [result])
    })
  }

  // protocol-less URL, purge both http & https
  async.parallel(
    [
      makePurgeTask(["http", fileUrl].join("://")),
      makePurgeTask(["https", fileUrl].join("://")),
    ],
    complete
  )
}

function makePurgeTask(fileUrl) {
  return function purgeTask(next) {
    purge(fileUrl, next)
  }
}

function purge(purgeUrl, next) {
  if (purgeUrl.endsWith("/index.html")) {
    purgeUrl = purgeUrl.replace("/index.html", "/")
  }

  var options = { method: "PURGE" }
  debug(purgeUrl)
  fetch(purgeUrl, options)
    .then(async (res) => {
      const body = await res.json()
      debug({ body })
      next(null, body)
    })
    .catch((error) => {
      next(error)
    })
}
