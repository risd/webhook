'use strict';

require('colors');

var fs    = require('fs');
var Zip   = require('adm-zip');
var async = require('async');

var request  = require('request');
var wrench   = require('wrench');

var Firebase = require( './util/firebase/index' )
var firebaseTokenAuthStep = require( './util/firebase/token-auth' ).step
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginOrCreateUserStep = require( './util/firebase/login-or-create-user' ).step
var firebaseRetrieveSiteTokenStep = require( './util/firebase/retrieve-site-key' ).step

var runNpmInstallFn = require( './util/run-npm-install' )
var runGruntInit = require( './util/run-grunt-init' )
var unescapeSite = require( './util/unescape-site' )
var escapeSite = require( './util/escape-site' )
var printIntro = require( './util/print-intro' )

module.exports = function Recreate (options, callback) {
  if (typeof callback !== 'function') callback = exitCallback;

  var notSupportedMessage = `
    Recreate is not currently supported.
    webhook/webhook-server-open never released its implementation of this
    functionality, and it has not yet been ported over to
    @risd/webhook-server-open
  `
  return callback( new Error( notSupportedMessage ) )

  var firebase = Firebase( options )

  var config = {
    platformName: options.platformName || 'webhook',
    baseGit: 'http://dump.webhook.com/static',
    siteName:  escapeSite( options.siteName ),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: options.password,
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  var configFn = functor( config )

  // Directory where git repository is unzipped
  var tmpFolder = '.wh-generate';

  printIntro( confg.platformName )

  async.series( [
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginOrCreateUserStep.bind( null, configFn ),
    firebaseRetrieveSiteTokenStep.bind( null, configFn ),

    function downloadRepoStep (step) {
      // Download the repo to temp folder
      downloadRepo(config, tmpFolder, function (error, gitFolder) {
        if (error) {
          console.log('No repository found at '.red + config.baseGit.blue);
          return process.exit(1);
        }

        step();

      });
    },

    function generateProjectStep (step) {
      console.log('Installing project to folder...'.magenta);
      // Generates actual project
      generateProject(config, step);
    },

  ], function initialization ( error ) {
    if ( error ) return callback( error )

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
      runGruntInit( Object.assign( {}, options, config ), function() {
        console.log('\n========================================================'.blue);
        console.log('# We just created a new site on your computer.         #'.blue);
        console.log('========================================================'.blue);
        console.log('#'.blue + ' Next step: Type '+ 'cd '.cyan + dirName.cyan + ' and then' + ' wh serve'.cyan + ''.blue)
        console.log('# ---------------------------------------------------- #'.blue)
        step()
      } )
    });

  });
};

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

  var repoUrl = 'http://server.webhook.com/';

  if(config.server) {
    if(config.server.indexOf('http://') !== 0) {
      config.server = config.server += 'http://';
    }

    if(config.server.indexOf(config.server.length - 1) !== '/') {
      config.server += '/';
    }

    repoUrl = config.server;
  }

  var repoRequest = request(repoUrl + 'download/?site=' + config.siteName + '&token=' + config.siteToken);

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

  var siteDir = process.cwd() + '/' + dirName;

  if(fs.existsSync(siteDir + '/.wh-original')) {
    if(fs.existsSync(siteDir + '/.wh-original/pages')) {
      wrench.rmdirSyncRecursive(siteDir + '/pages');
      wrench.copyDirSyncRecursive(siteDir + '/.wh-original/pages', siteDir + '/pages', {
        forceDelete: true
      })
    }
    if(fs.existsSync(siteDir + '/.wh-original/templates')) {
      wrench.rmdirSyncRecursive(siteDir + '/templates');
      wrench.copyDirSyncRecursive(siteDir + '/.wh-original/templates', siteDir + '/templates', {
        forceDelete: true
      })
    }
    if(fs.existsSync(siteDir + '/.wh-original/static')) {
      wrench.rmdirSyncRecursive(siteDir + '/static');
      wrench.copyDirSyncRecursive(siteDir + '/.wh-original/static', siteDir + '/static', {
        forceDelete: true
      })
    }

    wrench.rmdirSyncRecursive(siteDir + '/.wh-original'); 
  }

  callback();
}

function firebaseRetrieveToken(config, step) {
  firebaseRoot.auth(config.firebaseToken, function(error, auth) {
    if(error) {
      process.exit(2);
    }
    
    var data = {};
    data[config.webhookEscapedUsername] = config.webhookUsername;

    firebaseRoot.child('sites/'+ config.siteName).once('value', function(data) {
      data = data.val();
      if(data.key) {
        config.siteToken = data.key
      }

      step();
    }, function(err) {
      if(err.code === 'PERMISSION_DENIED') // Either this doesn't exist yet or it does and we dont have access
      {
        console.log('This site does not exist or you do not have permissions'.red);
        process.exit(3);
      }
    });

  });
}
