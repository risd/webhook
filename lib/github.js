'use strict';
require('colors');

var async = require('async');

var Firebase = require( './util/firebase/index' )
var firebaseTokenAuthStep = require( './util/firebase/token-auth' ).step
var ensureSiteNameAndKeyExistStep = require( './util/ensure-site-name-and-key-exist' ).step
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginUserStep = require( './util/firebase/login-user' ).step

var unescapeSite = require( './util/unescape-site.js' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )
var GetSetDefault = require( './util/get-set-default' )


/**
 * Get/set/remove github user/repo information.
 *
 * The repo information is used to support updating a site
 * without having a local copy of it.
 * 
 * @param  {object}   options
 * @param  {string}   options.gitSet?       The git user/repo string to set for the current site.
 * @param  {string}   options.gitRemove?    Set the user/repo string to null, removing it from firebase.
 * @param  {Function} callback
 */
module.exports = function DeployConfiguration ( options, callback ) {
  if (typeof callback !== 'function') callback = exitCallback;

  var firebase = Firebase( options )

  // get config is the default
  var config = {
    siteName: options.siteName || null,
    siteKey: options.siteKey || null,
    webhookUsername: options.email ? options.email.toLowerCase() : null,
    webhookPassword: options.password,
    platformName: options.platformName || 'webhook',
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  var configFn = functor( config )

  var baseSeries = [
    ensureSiteNameAndKeyExistStep.bind( null, configFn )
  ]

  var authSeries = [
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginUserStep.bind( null, configFn )
  ]

  // Determine series of steps for Set, Remove, or Get github configuration
  if ( options.gitSet ) {
    config.siteGithub = options.gitSet;
    var series = baseSeries.concat( authSeries ).concat([ setGitConfiguration ])
  }
  else if ( options.gitRemove ) {
    config.siteGithub = null;
    var series = baseSeries.concat( authSeries ).concat([ removeGitConfiguration ])
  }
  else {
    var series = baseSeries.concat([ getGitConfiguration ])
  }
  
  async.series( series, function onComplete ( error ) {
    if ( error ) return callback( error )
     else return callback( undefined, configFn().siteGithub )
  })

  function getGitConfiguration ( step ) {
    firebase.siteGithub( { siteName: configFn().siteName } )
      .then( handleGetGitConfiguration )
      .catch( step )

    function handleGetGitConfiguration ( githubConfigSnapshot ) {
      var githubConfiguration = githubConfigSnapshot.val()
      config.siteGithub = githubConfiguration;
      console.log( githubConfiguration )
      step()
    }
  }

  function setGitConfiguration ( step ) {
    firebase.siteGithub( { siteName: configFn().siteName }, configFn().siteGithub )
      .then( handleSetGitConfiguration )
      .catch( step )

    function handleSetGitConfiguration ( githubConfigSnapshot ) {
      console.log( `Successfully set github user/repo configuration for ${ unescapeSite( configFn().siteName ) } as: ${ configFn().siteGithub }` )
      step()
    }
  }

  function removeGitConfiguration ( step ) {
    firebase.siteGithub( { siteName: configFn().siteName }, null )
      .then( handleRemoveGitConfiguration )
      .catch( step )

    function handleRemoveGitConfiguration () {
      console.log( `Successfully removed github user/repo configuration for ${ unescapeSite( configFn().siteName ) }.` )
      step()
    }
  }

}
