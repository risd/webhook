'use strict';

require('colors');

var fs    = require('fs');
var Zip   = require('adm-zip');
var async = require('async');
var request  = require('request');
var wrench   = require('wrench');
var inquirer = require('inquirer');

var Firebase = require( './util/firebase/index' )
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginOrCreateUserStep = require( './util/firebase/login-or-create-user' ).step

var uniqueId = require( './util/unique-id' )
var unescapeSite = require( './util/unescape-site' )
var escapeSite = require( './util/escape-site' )
var runNpmInstallFn = require( './util/run-npm-install' )
var runGruntInit = require( './util/run-grunt-init' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )

module.exports = function Create (options, callback) {
  if (typeof callback !== 'function') callback = exitCallback;

  var firebase = Firebase( options )

  // Set of basic configuration for this (Defaults)
  var config = {
    generate: options.generate || 'http://dump.webhook.com/static/generate-repo.zip',
    siteName:  escapeSite( options.siteName ),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: '',
    server: options.server,
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
    imgix_host: options.imgix_host || null,
    imgix_secret: options.imgix_secret || null,
    platformName: options.platformName || 'webhook',
  }

  var configFn = functor( config )

  // Directory where git repository is unzipped
  var tmpFolder = '.wh-generate';

  printLogo( config.platformName );

  async.series([
    validateSiteName,
    confirmDirectoryOverwrite,
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginOrCreateUserStep.bind( null, configFn ),
    firebaseReserverSiteStep.bind( null, configFn ),
    firebaseCreateSiteStep.bind( null, configFn ),
    downloadGenerateRepo,
    installProject,
  ], cleanUpOnComplete( callback ) )

  function validateSiteName (step) {
    var isValidSite = function(sitename) {
      return /^[\d\w\-_\.,]+$/.test(sitename);
    }
    if(!isValidSite(config.siteName)) {
      var error_message = 'Invalid sitename. Can only contain letters, numbers, and dashes.';
      console.log(error_message.red);
      return callback(new Error(error_message))
    }

    step();
  }

  function confirmDirectoryOverwrite (step) {
    if(fs.existsSync(config.siteName) && !options.force) {
      inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'There is already a directory named ' + config.siteName + '. This will overwrite that directory. Continue?'
      }, function(answer) {
        if(answer.confirm) {
          step();
        } else {
          return callback();
        }
      });
    } else {
      step();
    }
  }

  function downloadGenerateRepo (step) {
    // Download the repo to temp folder
    downloadRepo(config, tmpFolder, function (error, gitFolder) {
      if (error) {
        var error_message = 'No repository found at ';
        var error_detail = config.generate;
        console.log(error_message.red + error_detail.blue);
        error_message += error_detail;
        return callback(error_message);
      }

      step();
    });
  }
  
  function installProject (step) {
    console.log('Installing project to folder...'.magenta);
    // Generates actual project
    generateProject(config, step);
  }

  function cleanUpOnComplete ( callback ) {
    return function cleanUp ( error ) {
      if ( error ) {
        console.log( error.message.red )
        return callback( error )
      }

      // Cleanup temporary folder
      wrench.rmdirSyncRecursive(tmpFolder);

      console.log('Running initialization...'.magenta);

      // Run first time initialization

      var dirName = config.siteName;

      if(config.firebase !== 'webhook') {
        dirName = unescapeSite(dirName);
      }

      var runNpmInstall = runNpmInstallFn( Object.assign( { dirName: dirName }, options ) )

      runNpmInstall(function() {

        runGruntInit( Object.assign( { dirName: dirName }, options, config ), function () {

          console.log('\n========================================================'.blue);
          console.log(  '# We just created a new site on your computer.         #'.blue);
          console.log(  '========================================================'.blue);
          console.log(  '#'.blue + ' Next steps:' + '                                          #'.blue)
          console.log(  '$ cd '.cyan + dirName.cyan )
          console.log(  '$ npm start'.cyan )

          callback(undefined, config);
        } )
      } )
    }
  }
}

/**
 * Downloads repository from github and stores in temporary folder
 * @param  {Object}    config     Configuration information
 * @param  {String}    tmpFolder  Temporary foler to save unzipped item into
 * @param  {Function}  callback   Called on completion
 */
function downloadRepo(config, tmpFolder, callback) {

  console.log('Downloading repo...'.magenta);

  // Keep track if the request fails to prevent the continuation of the install
  var requestFailed = false;

  var repoRequest = request(config.generate);

  repoRequest
    .on('response', function (response) {
      // If we fail, set it as failing and remove zip file
      if (response.statusCode !== 200) {
        requestFailed = true;
        fs.unlinkSync('repo.zip');
        callback(true);
      }
    })
    .pipe(fs.createWriteStream('repo.zip'))
    .on('close', function () {
      if (requestFailed) return;

      console.log('Extracting Files...'.magenta);
      // Unzip into temporary file
      var zip = new Zip('repo.zip');
      zip.extractAllTo(tmpFolder);
      fs.unlinkSync('repo.zip');
      callback(null, tmpFolder + '/' + fs.readdirSync(tmpFolder)[0]);
    });
}

/**
 * Generates project from copied repository
 * @param  {Object}    config     Configuration information
 * @param  {String}    gitFolder  Temporary foler to save unzipped item into
 * @param  {Function}  callback   Called on completion
 */
function generateProject(config, callback) {
  var dirName = config.siteName;

  if(config.firebase !== 'webhook') {
    dirName = unescapeSite(dirName);
  }

  wrench.copyDirSyncRecursive('.wh-generate/', process.cwd() + '/' + dirName, {
    forceDelete: true
  });

  callback();
}

function printLogo ( platformName ) {
  console.log(`To begin log in or create a ${ platformName } account below.\n`.green);
}

function firebaseReserverSiteStep ( configFn, step ) {
  var config = configFn()

  var firebase = config.firebase;

  var ownerData = {};
  ownerData[config.webhookEscapedUsername] = config.webhookUsername;

  firebase.siteManagement( config )
    .then( handleSiteMangementSnapshot )
    .catch( catchSiteManagementError )

  function handleSiteMangementSnapshot ( siteManagementSnapshot ) {
    var siteManagement = siteManagementSnapshot.val()
    if ( siteManagement && siteManagement.key ) {
      config.siteKey = siteManagement.key;
    }

    if(siteManagement && siteManagement.owners && !siteManagement.owners[config.webhookEscapedUsername]) {
      console.log( siteNameTakenMessage( config.siteName ) )
      return step( new Error('Site already exists') );
    }

    step();
  }

  function catchSiteManagementError ( error ) {
    if ( error.code === 'PERMISSION_DENIED' ) {
      // Either this doesn't exist yet or it does and we dont have access
      firebase.siteOwners( config, ownerData )
        .then( step )
        .catch( step )
    } else {
      return step( err )
    }
  }
}

function firebaseCreateSiteStep ( configFn, step ) {
  var config = configFn()

  if ( config.siteKey ) {
    console.log( 'Site information downloaded from webhook, creating project directory'.cyan )
    return step()
  }
  
  console.log( 'Signaling webhook to create site'.green )

  var createPayload = {
    userid: config.webhookUsername,
    sitename: config.siteName,
    id: uniqueId(),
  }

  var firebase = config.firebase;

  firebase.siteError( config, false )
    .then( firebase.siteCreate.bind( null, config.siteName, createPayload ) )
    .then( listenForSiteManagementValues ) // PICKUP
    .catch( step )

  function listenForSiteManagementValues () {

    firebase.siteManagementOnValue( config, listenOnSiteManagement )

    function listenOnSiteManagement ( siteManagementSnapshot ) {
      var siteManagement = siteManagementSnapshot.val()

      if ( siteManagement.key ) {
        config.siteKey = siteManagement.key
        firebase.siteManagementOffValue( config, listenOnSiteManagement )
        step()
      }

      if ( siteManagement.error ) {
        var error_message = 'Unable to create ';
        var error_detail = config.siteName;
        var error_explained = '. Please make sure your site name is valid.';
        console.log(error_message.red + error_detail.red + error_explained.red);
        error_message += error_detail + error_explained;
        step( new Error( error_message ) )
      }
    }

    function handlErrorOnListener (error) {
      console.log( error.message.red )
      step( error )
    }
  }
}

function siteNameTakenMessage ( siteName ) {
  return `
    ========================================================
    # The site ${ siteName } is already taken              #
    ========================================================
    # This name has already been taken by another user.    #
    # Please try a different one. Site names have nothing  #
    # to do with the domain you\'ll eventually use.        #
    # ---------------------------------------------------- #`.red;
}