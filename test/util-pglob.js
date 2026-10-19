const test = require("tape")
const path = require("node:path")
const pglob = require("../lib/util/glob-promise.js")

test("mock-site", async (t) => {
  const files = await pglob("**/*", {
    ignore: [".push", ".push/**/*"],
    cwd: path.join(process.cwd(), "test", "mock-site"),
    dot: true,
  })

  const hasFiles = [
    ".DS_Store",
    ".push.tgz",
    "Gruntfile.js",
    "libs",
    "libs/generate.js",
    "package.json",
  ]

  let hasAllFiles = true
  for (const file of files) {
    if (!hasFiles.includes(file)) {
      hasAllFiles = false
    }
  }

  t.ok(hasAllFiles, "all files in mock-site found")
})
