'use strict';

require('colors');

var async = require( 'async' )

var Firebase = require( './util/firebase/index' )
var firebaseTokenAuthStep = require( './util/firebase/token-auth' ).step
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginOrCreateUserStep = require( './util/firebase/login-or-create-user' ).step
var firebaseRetrieveSiteTokenStep = require( './util/firebase/retrieve-site-key' ).step

var escapeSite = require( './util/escape-site' )
var runNpmInstallFn = require( './util/run-npm-install' )
var runGruntInit = require( './util/run-grunt-init' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )

module.exports = function ( options, callback ) {
  if (typeof callback !== 'function') callback = exitCallback;

  var firebase = Firebase( options )

  var config = {
    platformName: options.platformName || 'webhook',
    siteName: escapeSite( options.siteName ),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: '',
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  var configFn = functor( config )

  return async.series([
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginOrCreateUserStep.bind( null, configFn ),
    firebaseRetrieveSiteTokenStep.bind( null, configFn ),
  ], initialize( complete ) );

  function initialize ( step ) {
    return function intializeFn ( error ) {
      if ( error ) {
        return step( error )
      }
      console.log('Running initialization...'.magenta);

      var runNpmInstall = runNpmInstallFn( options )

      runNpmInstall( function runGruntInitFn ()  {
        runGruntInit( Object.assign( {}, options, config ), step )
      } )
    }
  }

  function complete ( error ) {
    if ( ! error ) {
      console.log('Done initializing.'.green);
    }
    callback( error )
  }
}
