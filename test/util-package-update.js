const test = require("tape")
const PackageUpdate = require("../lib/util/package-update.js")
const env = require("./env.js")()

const v1 = {
  [env.utilPackageUpdate.platformName]: {
    generate: "1.0.0",
  },
  devDependencies: {
    mississippi: "2.0.0",
  },
  dependencies: {
    "node-sass": "4.11.0",
    moment: "2.24.8",
  },
  scripts: {
    start: "grunt",
    test: "tape test/*.js",
  },
}

const v2 = {
  [env.utilPackageUpdate.platformName]: {
    generate: "2.0.0",
  },
  devDependencies: {
    mississippi: "2.0.0",
    mkdirp: "0.4.0",
  },
  dependencies: {
    "node-sass": "6.11.0",
  },
  scripts: {
    start: "grunt --force",
  },
}

const combined = {
  [env.utilPackageUpdate.platformName]: {
    generate: "2.0.0",
  },
  devDependencies: {
    mississippi: "2.0.0",
    mkdirp: "0.4.0",
  },
  dependencies: {
    "node-sass": "6.11.0",
    moment: "2.24.8",
  },
  scripts: {
    start: "grunt --force",
    test: "tape test/*.js",
  },
}

test("update-package", function (t) {
  t.plan(1)

  const packageUpdate = PackageUpdate(env.utilPackageUpdate.platformName, v1)
  packageUpdate.with(v2)

  t.deepEqual(
    packageUpdate.write(),
    combined,
    "updated package matches expected output"
  )
})
