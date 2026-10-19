const test = require("tape")

const deployArchive = require("../lib/util/deploy-archive.js")

const fs = require("node:fs")
const path = require("path")

const filesToArchive = ["Gruntfile.js", "package.json", "libs/generate.js"]
const archiveDirectory = path.join("test", "mock-site")
const deployArchivePath = path.join(archiveDirectory, ".push.tgz")
const extractCwd = path.join(archiveDirectory, ".push")

test.onFinish(function () {
  fs.rmdirSync(extractCwd, {
    recursive: true,
    force: true,
  })
  fs.unlinkSync(deployArchivePath)
})

test("create-archive", function (t) {
  t.plan(1)

  const createOptions = {
    cwd: archiveDirectory,
    files: filesToArchive,
    archivePath: deployArchivePath,
  }

  deployArchive
    .create(createOptions)
    .then(function () {
      t.ok(true, "finished without error")
    })
    .catch(function (error) {
      t.notOk(error, "failed with error")
    })
})

test("extract-archive", function (t) {
  t.plan(1)

  fs.mkdirSync(extractCwd, { recursive: true })

  const extractOptions = {
    cwd: extractCwd,
    archivePath: deployArchivePath,
  }

  deployArchive
    .extract(extractOptions)
    .then(function () {
      t.ok(true, "finished without error")
    })
    .catch(function (error) {
      t.notOk(error, "failed with error")
    })
})

test("verify-extract-archive", function (t) {
  t.plan(filesToArchive.length)

  filesToArchive.forEach(function (file) {
    const extractedFile = path.join(extractCwd, file)
    try {
      fs.accessSync(extractedFile, fs.constants.F_OK)
      t.ok(true, `file exists: ${extractedFile}`)
    } catch (error) {
      t.notOk(error, `file does not exist: ${extractedFile}`)
    }
  })
})
