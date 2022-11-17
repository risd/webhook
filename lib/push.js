"use strict"
require("colors")

const debug = require("debug")("push")
const fs = require("node:fs")
const path = require("path")
const url = require("url")
const axios = require("axios")
const FormData = require("form-data")
const mime = require("mime")
mime.define({ "application/x-gtar": ["tgz"] })

const errors = require("./errors.js")
const pglob = require("./util/glob-promise.js")
const ensureSiteNameAndKeyExist = require("./util/ensure-site-name-and-key-exist")
const runBuild = require("./util/run-build")
const createArchive = require("./util/deploy-archive").create

var gitBranch = require("./util/git-branch")

module.exports = async function Push(options) {
  // Set of basic configuration for this (Defaults)
  let config = {
    cwd: options.cwd || process.cwd(),
    custom: options.server || false,
    server: options.server,
    uploadUrl: "http://server.webhook.com/upload/",
    siteName: options.siteName,
    siteKey: options.siteKey,
    branch: options.branch || gitBranch(),
    skipBuild: options.skipBuild || false,
    http: options.http || false,
  }

  if (config.custom) {
    var uploadUrlFor = function (server) {
      if (config.server.indexOf("https://") === 0)
        server = server.replace("https://", "")
      if (config.server.indexOf("http://") === 0)
        server = server.replace("http://", "")

      var protocol = config.http ? "http" : "https"

      return url.resolve(protocol + "://" + server, "/upload/")
    }

    config.uploadUrl = uploadUrlFor(options.server)
  }

  await ensureSiteNameAndKeyExist(config)

  if (config.skipBuild === false) {
    await runBuild({ options: { cwd: config.cwd } })
  }

  const pushArchiveFileName = ".push.tgz"
  const pushArchivePath = path.join(config.cwd, pushArchiveFileName)

  await createDeployArchive({
    archiveName: pushArchiveFileName,
    archivePath: pushArchivePath,
    cwd: config.cwd,
    custom: config.custom,
  })

  await uploadDeployArchive({
    uploadUrl: config.uploadUrl,
    siteName: config.siteName,
    siteKey: config.siteKey,
    branch: config.branch,
    payload: {
      content: fs.readFileSync(pushArchivePath),
      fileName: pushArchiveFileName,
      contentType: mime.getType(pushArchiveFileName),
    },
  })

  if (fs.existsSync(pushArchivePath)) {
    fs.unlinkSync(pushArchivePath)
  }
}

async function createDeployArchive({ archiveName, archivePath, cwd, custom }) {
  try {
    if (fs.existsSync(archivePath)) {
      fs.unlinkSync(archivePath)
    }

    var ignore = [".build/**", ".git/**", archiveName, "node_modules/**"]
    if (!custom) {
      ignore = ignore.concat(
        "package.json",
        "Gruntfile.js",
        "libs/**",
        "tasks/**",
        "options/**"
      )
    }
    const files = await pglob("**/*", { ignore, cwd, dot: true })

    var filesToArchive = files
      .map(function toFileSpec(file) {
        return {
          archivePath: file,
          localPath: path.join(cwd, file),
        }
      })
      .filter(function isNotDirectory(file) {
        return !fs.lstatSync(file.localPath).isDirectory()
      })
      .map(function toFile(fileSpec) {
        return fileSpec.archivePath
      })

    await createArchive({
      files: filesToArchive,
      cwd,
      archivePath,
    })
  } catch (error) {
    error.code = errors.ERROR_PUSH_SITE_ARCHIVE
    throw error
  }
}

async function uploadDeployArchive({
  uploadUrl,
  siteName,
  siteKey,
  branch,
  payload,
}) {
  debug("Uploading, this might take a minute.")
  debug("uploadUrl:", uploadUrl)
  debug("siteName:", siteName)
  debug("siteKey:", siteKey)
  debug("branch:", branch)
  debug("payload:", payload)

  const form = new FormData()

  form.append("payload", payload.content, {
    filename: payload.fileName,
    contentType: payload.contentType,
  })
  form.append("site", siteName)
  form.append("token", siteKey)
  form.append("branch", branch)

  return new Promise((resolve, reject) => {
    axios
      .post(uploadUrl, form, {
        headers: form.getHeaders(),
      })
      .then((response) => {
        const body = response.data

        if (!body || body.error) {
          const errorStack = body ? body.error : "Unknown error"
          const error = new Error("Error uploading archive")
          error.code = errors.ERROR_PUSH_SITE_UPLOAD
          error.stack = `${errorStack}\n${error.stack}`
          return reject(error)
        }

        resolve()
      })
      .catch((error) => {
        error.code = errors.ERROR_PUSH_SITE_UPLOAD
        reject(error)
      })
  })
}
