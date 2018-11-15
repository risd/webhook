'use strict';

require('colors');

var async = require('async');

var Firebase = require( './util/firebase/index' )
var firebaseTokenAuthStep = require( './util/firebase/token-auth' ).step
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginUserStep = require( './util/firebase/login-user' ).step
var ensureSiteNameAndKeyExistStep = require( './util/ensure-site-name-and-key-exist' ).step

var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )


/**
 * Send domain mapping signal to the server
 * 
 * @param  {object}   options
 * @param  {Function} callback
 */
module.exports = function MapDomain ( options, callback ) {
  if (typeof callback !== 'function') callback = exitCallback;

  var firebase = Firebase( options )

  var config = {
    platformName: options.platformName || 'webhook',
    siteName: options.siteName || null,
    siteKey: options.siteKey || null,
    webhookUsername: options.webhookUsername || null,
    webhookPassword: null,
    maskDomain: options.maskDomain,
    contentDomain: options.contentDomain,
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  var configFn = functor( config )

  var series = [
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginUserStep.bind( null, configFn ),
    pushDomainMapStep,
  ]
  
  async.series( series, callback )

  function pushDomainMapStep ( step ) {
    
    firebase.siteMapDomain( config )
      .then( logSuccess )
      .catch( step )

    function logSuccess () {
      if ( config.contentDomain ) var msg = `Signaled server to set ${ config.maskDomain } to pull content from ${ config.contentDomain }`
      else var msg = `Signaled server to remove the domain ${ config.maskDomain } from content mapping configuration.`  
      console.log( msg )
      step()  
    }
   }
}
