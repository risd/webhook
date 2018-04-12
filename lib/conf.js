'use strict';

require('colors');

var async = require('async');
var winSpawn = require('win-spawn');
var firebase = require('firebase');

var authenticateFirebaseInstance = require( './util/authenticate-firebase-instance' )
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
    authenticateFirebaseInstanceStep,
    firebaseRetrieveSiteTokenStep,
  ], intialize );

  function authenticateFirebaseInstanceStep ( step ) {
    authenticateFirebaseInstance( { config: config, firebase: firebaseRoot }, step )
  }

  function firebaseRetrieveSiteTokenStep ( step ) {
    firebaseRetrieveSiteToken( firebaseRoot )( config , step );
  }

  function intialize () {
    
    console.log('Preparing .firebase.conf & cms files.'.magenta);

    runGruntInit( Object.assign( {}, options, config ), function complete () {
      console.log('Done preparing files.'.green);
      process.exit(0);
    } )
  }
}
