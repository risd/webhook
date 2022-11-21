const debug = require("debug")("create")

const fs = require("node:fs")
const path = require("node:path")
const mkdirp = require("mkdirp")
const cpr = require("cpr")
const inquirer = require("inquirer")
const tar = require("tar")

const errors = require("./errors")
const firebaseErrors = require("./util/firebase/errors.js")
const Firebase = require("./util/firebase/index")
const getUserLoginInformation = require("./util/get-user-login-information")
const firebaseLoginOrCreateUser = require("./util/firebase/login-or-create-user")

const uniqueId = require("./util/unique-id")
const unescape = require("./util/unescape-site")
const escape = require("./util/escape-site")
const downloadGenerate = require("./util/download-generate")
const runNpmInstall = require("./util/run-npm-install")
const runGruntInit = require("./util/run-grunt-init")
const runGitInit = require("./util/run-git-init")

async function Create(options) {
  const firebase = Firebase(options)

  // Set of basic configuration for this (Defaults)
  var config = {
    cwd: options.cwd || process.cwd(),
    generate: options.generate,
    generateTmpFolder: ".wh-generate",
    siteName: escape(options.siteName),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : "",
    webhookEscapedUsername: "",
    webhookPassword: options.password,
    webhookCreateUserProgrammatically:
      options.createUserProgrammatically || false,
    server: options.server,
    firebaseName: options.firebaseName || "webhook",
    firebaseAPIKey: options.firebaseAPIKey,
    firebase,
    imgix_host: options.imgix_host || null,
    imgix_secret: options.imgix_secret || null,
    platformName: options.platformName || "webhook",
    force: options.force || false,
  }

  const isValidSite = function (siteName) {
    return /^[\d\w\-_\.,]+$/.test(siteName)
  }

  if (!isValidSite(config.siteName)) {
    const error = new Error("Invalid site name.")
    error.code = errors.ERROR_CREATE_INVALID_SITE_NAME
    throw error
  }

  await confirmDirectoryOverwrite(config)

  if (config.webhookUsername && config.webhookPassword) {
    config.webhookEscapedUsername = escape(config.webhookUsername)
  } else {
    const { username, password } = await getUserLoginInformation(config)
    config.webhookUsername = username
    config.webhookEscapedUsername = escape(config.webhookUsername)
    config.webhookPassword = password
  }

  if (!firebase.currentUser()) {
    await firebaseLoginOrCreateUser({
      firebase,
      userEmail: config.webhookUsername,
      userPassword: config.webhookPassword,
      webhookCreateUserProgrammatically:
        config.webhookCreateUserProgrammatically,
    })
  }

  await firebaseReserverSite(config)
  await firebaseCreateSite(config)
  await downloadGenerateArchive(config)
  await extract(config)
  await installProject(config)
  return

  function confirmDirectoryOverwrite({ siteName, force }) {
    if (fs.existsSync(siteName) && !force) {
      return new Promise((resolve, reject) => {
        inquirer
          .prompt({
            type: "confirm",
            name: "confirm",
            message:
              "There is already a directory named " +
              siteName +
              ". This will overwrite that directory. Continue?",
          })
          .then(function (answer) {
            if (answer.confirm) {
              resolve()
            } else {
              const error = new Error("Did not confirm create. Aborted.")
              error.code = errors.ERROR_CREATE_DIRECTORY_NOT_CONFIRMED
              reject(error)
            }
          })
      })
    } else {
      return Promise.resolve()
    }
  }

  async function downloadGenerateArchive(config) {
    debug("Downloading:", config.generate)
    try {
      const downloadedGenerate = await downloadGenerate({
        packageOrUrl: config.generate,
        cwd: config.cwd,
      })
      config.downloadedGenerate = downloadedGenerate
    } catch (error) {
      error.code = errors.ERROR_CREATE_DOWNLOAD_GENERATE
      throw error
    }
    return
  }

  function extract({ generateTmpFolder, downloadedGenerate }) {
    return new Promise((resolve, reject) => {
      var extractTo = path.join(process.cwd(), generateTmpFolder)
      try {
        mkdirp.sync(extractTo)
      } catch (error) {
        error.code = errors.ERROR_CREATE_GENERATE_TMP_FOLDER_CREATION
        reject(error)
      }

      debug("Extracting...".magenta)
      fs.createReadStream(downloadedGenerate)
        .pipe(
          tar.extract({
            cwd: extractTo,
            strip: 1,
          })
        )
        .on("error", (error) => {
          error.code = errors.ERROR_CREATE_GENERATE_EXTRACT
          reject(error)
        })
        .on("finish", () => {
          fs.unlinkSync(downloadedGenerate)
          resolve()
        })
    })
  }

  async function installProject(config) {
    debug("Installing project to folder...")
    const siteFolder = path.join(config.cwd, unescape(config.siteName))
    try {
      await cprp(config.generateTmpFolder, siteFolder, { overwrite: true })
    } catch (error) {
      error.code = errors.ERROR_CREATE_COPY_GENERATOR
      throw error
    }

    debug("Running initialization...")
    await runNpmInstall({ cwd: siteFolder })
    await runGruntInit({
      ...options,
      ...config,
      cwd: siteFolder,
    })
    await runGitInit({ cwd: siteFolder })
  }
}

function cprp(source, destionation, options) {
  return new Promise((resolve, reject) => {
    cpr(source, destionation, options, (error, files) => {
      if (error) return reject(error)
      resolve()
    })
  })
}

async function firebaseReserverSite(config) {
  debug("firebaseReserverSite")
  var firebase = config.firebase

  var ownerData = {}
  ownerData[config.webhookEscapedUsername] = config.webhookUsername

  try {
    const siteManagementSnapshot = await firebase.siteManagement(config)
    const siteManagement = siteManagementSnapshot.val()
    if (siteManagement && siteManagement.key) {
      const error = new Error("Site already exists.")
      error.code = errors.ERROR_CREATE_SITE_NAME_ALREADY_TAKEN
      throw error
    }
  } catch (error) {
    debug("firebaseReserverSite:error")
    debug(error.message)
    debug(error.code)
    if (error.message === firebaseErrors.DATABASE_PERMISSION_DENIED) {
      debug("correclty-id-error")
      await firebase.siteOwners(config, ownerData)
    } else {
      throw error
    }
  }
}

async function firebaseCreateSite(config) {
  debug("Signaling webhook to create site")

  var createPayload = {
    userid: config.webhookUsername,
    sitename: config.siteName,
    id: uniqueId(),
  }

  var firebase = config.firebase

  // reset site errors
  await firebase.siteError(config, false)
  // signal to the server to run create
  await firebase.siteCreate(config.siteName, createPayload)
  // listen for values until we get a management key,
  // this is our signal that we can continue with local
  // site creation
  await listenForSiteManagementValues()
  return

  function listenForSiteManagementValues() {
    return new Promise((resolve, reject) => {
      const siteManagementUnsubscribe = firebase.siteManagementOnValue(
        config,
        listenOnSiteManagement
      )

      function listenOnSiteManagement(siteManagementSnapshot) {
        debug("listenOnSiteManagement:snapshot")
        var siteManagement = siteManagementSnapshot.val()

        if (siteManagement && siteManagement.key) {
          debug("listenOnSiteManagement:snapshot:with-key")
          config.siteKey = siteManagement.key
          siteManagementUnsubscribe()
          resolve()
        }

        if (siteManagement && siteManagement.error) {
          siteManagementUnsubscribe()
          const error = new Error(`Server unable to create ${config.siteName}`)
          error.code = errors.ERROR_CREATE_SITE_SERVER_ERROR
          reject(error)
        }
      }
    })
  }
}

Create.cliLogSuccess = ({ siteName }) => {
  require("colors")
  console.log("========================================================".blue)
  console.log("# We just created a new site on your computer.         #".blue)
  console.log("========================================================".blue)
  console.log(
    "#".blue +
      " Next steps:" +
      "                                          #".blue
  )
  console.log("$ cd ".cyan + siteName.cyan)
  console.log("$ npm start".cyan)
}

Create.cliLogError = (error, { siteName }) => {
  require("colors")
  switch (error.code) {
    case errors.ERROR_MISMATCHING_PASSWPRDS:
      console.log(
        "========================================================".red
      )
      console.log("# Your passwords didn't match                         #".red)
      console.log(
        "========================================================".red
      )
      console.log(
        "# Happens to everyone. Why don't you give it another try.".red
      )
      console.log(
        "# ---------------------------------------------------- #".red
      )
      break
    case errors.ERROR_CREATE_INVALID_SITE_NAME:
      console.log(
        "Invalid sitename. Can only contain letters, numbers, and dashes.".red
      )
      break
    case errors.ERROR_FIREBASE_AUTH_WEAK_PASSWORD:
      console.log(
        "========================================================".red
      )
      console.log(
        "# Your password is too weak.                           #".red
      )
      console.log(
        "========================================================".red
      )
      console.log(
        "# Try again with a strong password.                    #".red
      )
      console.log(
        "# ---------------------------------------------------- #".red
      )
      break
    case errors.ERROR_CREATE_SITE_NAME_ALREADY_TAKEN:
      console.log(
        `
        ========================================================
        # The site ${siteName} is already taken              #
        ========================================================
        # This name has already been taken by another user.    #
        # Please try a different one. Or try initializing the
        # existing site using its code base.
        # ---------------------------------------------------- #`.red
      )
      break
    case errors.ERROR_CREATE_DOWNLOAD_GENERATE:
      console.log("Could not download generator from npm.".red)
      console.log(error)
      break
    default:
      console.log(error)
  }
}

module.exports = Create
