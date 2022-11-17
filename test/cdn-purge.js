const test = require("tape")
const purge = require("../lib/util/cdn-purge.js")
const env = require("./env.js")()

// env.cdnPurge.url : string ( starting with http or https )

test("cdn-purge:url-with-protocol", function (t) {
  t.plan(3)

  purge(env.cdnPurge.url, function onPurge(error, result) {
    t.notOk(error, "finishes without error")
    t.assert(
      result.length === 1,
      "finishes with a single purged request response result"
    )
    t.assert(result[0].status === "ok", "finishes with status: ok")
  })
})

test("cdn-purge:url-without-protocol", function (t) {
  t.plan(4)

  // ensure protocol-less url is being passed in
  const url = env.cdnPurge.url.startsWith("https://")
    ? env.cdnPurge.url.slice("https://".length)
    : env.cdnPurge.url.startsWith("http://")
    ? env.cdnPurge.url.slice("http://".length)
    : env.cdnPurge.url

  purge(url, function (error, result) {
    t.notOk(error, "finishes without error")
    t.assert(
      result.length === 2,
      "finishes with a two purged request response result"
    )
    t.assert(
      result[0].status === "ok",
      "finishes with status: ok for http request"
    )
    t.assert(
      result[1].status === "ok",
      "finishes with status: ok for https request"
    )
  })
})
