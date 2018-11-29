'use strict';
require('colors')

var async = require( 'async' )

var Firebase = require( './util/firebase/index' )
var firebaseTokenAuthStep = require( './util/firebase/token-auth' ).step
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginUserStep = require( './util/firebase/login-user' ).step

var unescape = require( './util/unescape-site' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )
var GetSetDefault = require( './util/get-set-default' )

module.exports = function ListSites ( options, callback ) {
  if (typeof callback !== 'function') callback = exitCallback;

  var firebase = Firebase( options )

  var config = {
    platformName: options.platformName || 'webhook',
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookPassword: options.password,
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  var configFn = functor( config )
  var sitesList = GetSetDefault( {} )

  async.series( [
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginUserStep.bind( null, configFn ),
    listSitesStep,
  ], function ( error ) {
    if ( error ) return callback( error )
    callback( null, sitesList() )
  } )

  function listSitesStep ( step ) {
    firebase.userSites( config.webhookUsername )
      .then( logSites )
      .catch( step )

    function logSites ( userSitesSnapshot ) {
      var userSites = userSitesSnapshot.val()
      sitesList( userSites )

      if( userSites.owners ) {
        console.log( '' )
        console.log( `The ${ config.platformName } sites I'm an owner of:`.green )
        for( var site in userSites.owners ) {
          console.log( unescape( site ) )
        }
      }
      if( userSites.users ) {
        console.log( '' )
        console.log( `The ${ config.platformName } sites I\'m a user of:`.blue )
        for( var site in userSites.users ) {
          console.log( unescape( site ) )
        }
      }
      if( ! userSites.users && ! userSites.owners ) {
        console.log( `Not an owner or user for any site on ${ config.platformName }`.red )
      }
      step( null, userSites )
    }
  }
};
