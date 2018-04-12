'use strict';

require('colors');

var async = require( 'async' )
var winSpawn = require( 'win-spawn' )
var firebase = require( 'firebase' )

var getUserLoginInformation = require( './util/get-user-login-information' )
var firebaseLoginOrCreateUser = require( './util/firebase-login-or-create-user' )
var firebaseRetrieveSiteToken = require( './util/firebase-retrieve-site-token' )

var uniqueId = require( './util/unique-id' )
var unescapeSite =  require( './util/unescape-site' )
var escapeSite = require( './util/escape-site' )
var runInDir = require( './util/run-in-dir' )
var runNpmInstallFn = require( './util/run-npm-install' )
var runGruntInit = require( './util/run-grunt-init' )


var firebaseRoot = null;

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
  ], intialize( complete ) );

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

  function intialize ( step ) {
    return function intializeFn () {
      console.log('Running initialization...'.magenta);

      var runNpmInstall = runNpmInstallFn( options )

      runNpmInstall( function runGruntInitFn ()  {
        runGruntInit( Object.assign( {}, options, config ), step )
      } )
    }
  }

  function complete () {
    console.log('Done initializing.'.green);
    process.exit(0);
  }
}
