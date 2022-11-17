const debug = require('debug')('update')
var fs    = require( 'fs' )
var path = require( 'path' )
var inquirer = require( 'inquirer' )
const rimraf = require('rimraf')

const errors = require('./errors')
var ensureSiteNameAndKeyExist = require( './util/ensure-site-name-and-key-exist' )
var downloadGenerate = require( './util/download-generate' )
var runGruntInit = require( './util/run-grunt-init' )
var runNpmInstall = require( './util/run-npm-install' )
var getGenerateVersion = require( './util/npm-view-version' )
var escapeSite = require( './util/escape-site' )
var generateExtract = require( './util/generate-extract' )
var PackageUpdate = require( './util/package-update.js' )

module.exports = async function Update (options) {
  var config = {
    cwd: options.cwd || process.cwd(),
    generate: options.generate, // generate | downloadedGenerate required
    generateVersion: options.generateVersion, // optional
    siteName: options.siteName ? escapeSite( options.siteName ) : undefined,
    siteKey: options.siteKey, // optional
    force: options.force, // optional
    platformName: options.platformName || 'webhook',
    deleteGenerate: options.deleteGenerate === false ? false : true,
    generatePath: options.generatePath, // generatePath | generate required
  }

  if (!config.force) {
    await acceptTerms()
  }

  await ensureSiteNameAndKeyExist(config)

  if (!fs.existsSync(config.generatePath)) {
    await downloadGenerateArchive(config)
  }

  if (!config.generateVersion) {
    config.generateVersion = await getGenerateVersion({
      package: config.generate,
      cwd: config.cwd,
    })
  }

  await extract(config)
  await initialize(config)

  if (config.deleteGenerate) {
    fs.unlinkSync(config.generatePath)
  }

  function acceptTerms () {
    return inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'This may modify your package.json file. Proceed?'
    })
    .then( function(answer) {
      if(answer.confirm) {
        return
      } else {
        throw new Error( 'Did not confirm update. Aborted.' )
      }
    })
  }

  async function downloadGenerateArchive (config) {
    debug('Downloading:', config.generate)
    try {
      const downloadedGenerate = await downloadGenerate({
        packageOrUrl: config.generate,
        cwd: config.cwd,
      })
      config.generatePath = downloadedGenerate
    }
    catch (error) {
      error.code = errors.ERROR_CREATE_DOWNLOAD_GENERATE
      throw error
    }
    return
  }

  function extract (config) {
    return new Promise((resolve, reject) => {

      var packagePath = path.join(config.cwd, 'package.json')
      var updatePackage = PackageUpdate(config.platformName, packagePath)

      generateExtract( {
        generatePath: config.generatePath,
        cwd: config.cwd,
        filesToExtract: [ 'libs', 'options', 'tasks', 'package.json' ],
      } ).on('error', reject)
         .on('finish', handleExtract)

      function handleExtract () {
        var platformUpdate = {}
        platformUpdate[ config.platformName ] = { generate: config.generateVersion }
        updatePackage.with( platformUpdate )
        updatePackage.with( packagePath )
        updatePackage.write( packagePath )
        resolve()
      }

    })
  }

  async function initialize (config) {
    if(fs.existsSync('node_modules')) {
      await removeDirectory(path.join(config.cwd, 'node_modules'))
    }

    await runNpmInstall({ cwd: config.cwd })
    await runGruntInit({
      ...options,
      ...config,
    })
  }
}

function removeDirectory (dir) {
  return new Promise((resolve, reject) => {
    rimraf(dir, (error) => {
      if (error) return reject(error)
      resolve()
    })
  })
}
