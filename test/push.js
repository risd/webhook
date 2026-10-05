const path = require("node:path")
const test = require("tape")
const push = require("../lib/push.js")
const env = require("./env.js")()

test.onFinish(process.exit)

test("push-without-error-module", async function (t) {
  t.plan(1)

  const pushOptions = {
    ...env.push,
    branch: "webhook-test",
    skipBuild: "true",
    http: false,
    cwd: path.join(process.cwd(), "test", "fake-site"),
  }

  try {
    await push(pushOptions)
    t.ok(true)
  } catch (error) {
    console.error(error)
    t.fail(error)
  }
})
