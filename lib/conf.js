'use strict';

var async = require('async');

require('colors');

var winSpawn = require('win-spawn');


console.warn = function() {};
var firebase = require('firebase');
var firebaseRoot = null;

var getUserLoginInformation = require( './util/get-user-login-information' )
var firebaseLoginOrCreateUser = require( './util/firebase-login-or-create-user' )
var firebaseRetrieveSiteToken = require( './util/firebase-retrieve-site-token' )

var uniqueId = require( './util/unique-id' )
var unescapeSite =  require( './util/unescape-site' )
var escapeSite = require( './util/escape-site' )
var runInDir = require( './util/run-in-dir' )
var runNpmInstallFn = require( './util/run-npm-install' )
var runGruntInit = require( './util/run-grunt-init' )

module.exports = function (options) {

  var config = {
    siteName: escapeSite( options.siteName ),
    siteToken: null,
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: '',
    firebaseName: options.firebaseName || 'webhook',
    firebaseToken: options.token || '',
  };
  
  if(options.node || options.npm) {
    winSpawn = require('child_process').spawn;
  }

  firebaseRoot = new firebase('https://' + config.firebaseName + '.firebaseio.com/management');

  return async.series([
    getUserLoginInformationStep,
    firebaseLoginOrCreateUserStep,
    firebaseRetrieveSiteTokenStep,
  ], intialize );

  function getUserLoginInformationStep ( step ) {
    if(config.firebaseToken) {
      config.webhookEscapedUsername = config.webhookUsername.replace(/\./g, ',1');
      step();
      return;
    }

    getUserLoginInformation('Webhook', function(username, password) {
      config.webhookUsername = username.toLowerCase();
      config.webhookEscapedUsername = username.toLowerCase().replace(/\./g, ',1');
      config.webhookPassword = password;
      step();
    });
  }

  function firebaseLoginOrCreateUserStep (step) {

    if(config.firebaseToken) {
      step();
      return;
    }
    
    firebaseLoginOrCreateUser(config, step);
  }

  function firebaseRetrieveSiteTokenStep ( step ) {
    firebaseRetrieveSiteToken( firebaseRoot )( config , step );
  }

  function intialize () {
    
    console.log('Preparing .firebase.conf & cms files.'.magenta);

    runGruntInit( Object.assign( {}, config, options ), function complete () {
      console.log('Done preparing files.'.green);
      process.exit(0);
    } )
  }
}
