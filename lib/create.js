// TODO: pickup on create
// - once create is done, move on to conf.
// would be great to get tests for all of these

require('colors');

const debug = require('debug')('create')

var fs    = require('fs');
var path  = require ( 'path' )
var async = require('async');
const mkdirp = require('mkdirp')
const cpr = require('cpr')
var wrench   = require('wrench');
var inquirer = require('inquirer');
var tar = require( 'tar' )

const errors = require('./errors')
const firebaseErrors = require('./util/firebase/errors.js')
var Firebase = require( './util/firebase/index' )
var getUserLoginInformation = require( './util/get-user-login-information' )
var firebaseLoginOrCreateUser = require( './util/firebase/login-or-create-user' )

var uniqueId = require( './util/unique-id' )
var unescape = require( './util/unescape-site' )
var escape = require( './util/escape-site' )
var downloadGenerate = require( './util/download-generate' )
var runNpmInstall = require( './util/run-npm-install' )
var runGruntInit = require( './util/run-grunt-init' )
var runGitInit = require( './util/run-git-init' )
var exitCallback = require( './util/exit-callback' )
var printIntro = require( './util/print-intro' )

module.exports = function Create (options, callback) {
  if (typeof callback !== 'function') callback = exitCallback;

  const firebase = Firebase( options )

  // Set of basic configuration for this (Defaults)
  var config = {
    cwd: options.cwd || process.cwd(),
    generate: options.generate,
    generateTmpFolder: '.wh-generate',
    siteName:  escape( options.siteName ),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: options.password,
    webhookCreateUserProgrammatically: options.createUserProgrammatically || false,
    server: options.server,
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebase,
    imgix_host: options.imgix_host || null,
    imgix_secret: options.imgix_secret || null,
    platformName: options.platformName || 'webhook',
    force: options.force || false,
  }

  const isValidSite = function() {
    return /^[\d\w\-_\.,]+$/.test(sitename)
  }

  if (!isValidSite(config.siteName)) {
    const error = new Error('Invalid site name.')
    error.code = errors.ERROR_CREATE_INVALID_SITE_NAME
    throw error
  }

  await confirmDirectoryOverwrite(config)

  if (config.webhookUsername && config.webhookPassword) {
    config.webhookEscapedUsername = escape(config.webhookUsername)
  }
  else {
    const { username, password } = await getUserLoginInformation()
    config.webhookUsername = username
    config.webhookEscapedUsername = escape(config.webhookUsername)
    config.webhookPassword = password
  }

  if (!firebase.currentUser()) {
    await firebaseLoginOrCreateUser({
      firebase,
      userEmail: config.webhookUsername,
      userPassword: config.webhookPassword,
      webhookCreateUserProgrammatically: config.webhookCreateUserProgrammatically,
    })
  }

  await firebaseReserverSite(config)
  await firebaseCreateSite(config)
  await downloadGenerate(config)
  await extract(config)
  await installProject(config)
  return

  function confirmDirectoryOverwrite ({ siteName, force }) {
    if(fs.existsSync(siteName) && !force) {
      return new Promise((resolve, reject) => {
        inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: 'There is already a directory named ' + siteName + '. This will overwrite that directory. Continue?'
          })
          .then( function(answer) {
            if(answer.confirm) {
              resolve()
            } else {
              const error = new Error('Did not confirm create. Aborted.')
              error.code = errors.ERROR_CREATE_DIRECTORY_NOT_CONFIRMED
              reject(error)
            }
          })
      })
    } else {
      return Promise.resolve()
    }
  }

  function downloadGenerate (config) {
    return new Promise((resolve, reject) => {
      // Download the repo to temp folder
      debug('Downloading...');
      downloadGenerate(config.generate, function (error, downloadedGenerate) {
        if (error) {
          error.code = errors.ERROR_CREATE_DOWNLOAD_GENERATE
          return reject(error)
        }

        config.downloadedGenerate = downloadedGenerate;
        resolve()
      });
    })
  }

  function extract (config) {
    return new Promise((resolve, reject) => {
      var extractTo = path.join(process.cwd(), config.generateTmpFolder)
      try {
        mkdirp.sync(extractTo)  
      }
      catch (error) {
        error.code = errors.ERROR_CREATE_GENERATE_TMP_FOLDER_CREATION
        reject(error)
      }

      debug('Extracting...'.magenta);
      fs.createReadStream(config.downloadedGenerate)
        .pipe(tar.extract({
          cwd: extractTo,
          strip: 1,
        }))
        .on('error', (error) => {
          error.code = errors.ERROR_CREATE_GENERATE_EXTRACT
          reject(error)
        })
        .on('finish', () => {
          fs.unlinkSync(config.downloadedGenerate)
          resolve()
        })
    })
  }
  
  async function installProject (config) {
    debug('Installing project to folder...');
    const siteFolder = path.join(config.cwd, config.siteName)
    try {
      await cprp(config.generateTmpFolder, siteFolder, { overwrite: true })
    }
    catch (error) {
      error.code = errors.ERROR_CREATE_COPY_GENERATOR
      throw error
    }

    debug('Running initialization...')
    await runNpmInstall({ dirName: siteFolder})
    await runGruntInit({
      ...options,
      ...config,
      dirName: siteFolder
    })
    await runGitInit({ dirName: siteFolder })
  }

function cprp (source, destionation, options) {
  return new Promise((resolve, reject) => {
    cpr(source, destionation, options, (error, files) => {
      if (error) return reject(error)
      resolve()
    })
  })
}

async function firebaseReserverSite (config) {
  var firebase = config.firebase

  var ownerData = {};
  ownerData[config.webhookEscapedUsername] = config.webhookUsername;

  const siteManagementSnapshot = await firebase.siteManagement(config)
  const siteManagement = siteManagementSnapshot.val()
  if (siteManagement && siteManagement.key) {
    const error = new Error('Site already exists.')
    error.code = errors.ERROR_CREATE_SITE_NAME_ALREADY_TAKEN
    throw error
  }
  else {
    // add current user to set of users
    await firebase.siteOwners(config, ownerData)
  }
}

async function firebaseCreateSite (config) {
  debug('Signaling webhook to create site')

  var createPayload = {
    userid: config.webhookUsername,
    sitename: config.siteName,
    id: uniqueId(),
  }

  var firebase = config.firebase;

  // reset site errors
  await firebase.siteError(config, false)
  // signal to the server to run create
  await firebase.siteCreate(config.siteName, createPayload)
  // listen for values until we get a management key,
  // this is our signal that we can continue with local
  // site creation
  await listenForSiteManagementValues()
  return

  function listenForSiteManagementValues () {
    return new Promise ((resolve, reject) => {
      const siteManagementUnsubscribe = firebase.siteManagementOnValue( config, listenOnSiteManagement )

      function listenOnSiteManagement ( siteManagementSnapshot ) {
        var siteManagement = siteManagementSnapshot.val()

        if (siteManagement && siteManagement.key) {
          config.siteKey = siteManagement.key
          siteManagementUnsubscribe()
          resolve()
        }

        if (siteManagement && siteManagement.error) {
          siteManagementUnsubscribe()
          const error = new Error(`Server unable to create ${ config.siteName }`)
          error.code = errors.ERROR_CREATE_SITE_SERVER_ERROR
          reject(error)
        }
      }
    })
  }
}