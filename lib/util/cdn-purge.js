var async = require("async")
var axios = require("axios")

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

  var options = { method: "purge", url: purgeUrl }
  try {
    axios(options)
      .then(function (response) {
        next(null, response.data)
      })
      .catch(function (error) {
        next(error)
      })
  } catch (error) {
    next(error)
  }
}
