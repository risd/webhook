const test = require("tape")
const siteDir = require("../lib/util/site-dir.js")
const unescapeSite = require("../lib/util/unescape-site.js")
const env = require("./env.js")()

env.utilSiteDir.siteName = unescapeSite(env.utilSiteDir.siteName)

test("push-without-error-util", async function (t) {
  t.plan(1)

  const pushOptions = {
    ...env.utilSiteDir,
    directory: "./test/assets",
  }

  try {
    await siteDir.asPromise(pushOptions)
    t.ok(true, "successfully finished site dir push")
  } catch (error) {
    t.fail(error, "failed to finish site dir push")
  }
})
