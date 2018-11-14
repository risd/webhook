'use strict';
require('colors');

var async = require('async');
var Deploys = require( 'webhook-deploy-configuration' );

var Firebase = require( './util/firebase/index' )
var firebaseTokenAuthStep = require( './util/firebase/token-auth' ).step
var ensureSiteNameAndKeyExistStep = require( './util/ensure-site-name-and-key-exist' ).step
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginUserStep = require( './util/firebase/login-user' ).step

var gitBranch = require( './util/git-branch' )
var unescapeSite = require( './util/unescape-site.js' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )


/**
 * Get/set/remove deploys
 * 
 * @param  {object}   options?               No options gets the deploy configuration
 * @param  {string}   options?.branch?       The branch to address when removing or adding a bucket
 * @param  {string}   options?.bucketSet?    The bucket to set
 * @param  {string}   options?.bucketRemove? The bucket to remove
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
    webhookPassword: '',
    branch: options.branch || gitBranch(),
    platformName: options.platformName || 'webhook',
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  var configFn = functor( config )

  var deploys = Deploys( firebase.database() )

  var baseSeries = [
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginUserStep.bind( null, configFn )
  ]

  // Determine series of steps for Set, Remove, or Get deploy configuration
  if ( options.bucketSet ) {
    config.bucketName = options.bucketSet;
    var series = baseSeries.concat([ setDeployConfiguration ])
  }
  else if ( options.bucketRemove ) {
    config.bucketName = options.bucketRemove;
    var series = baseSeries.concat([ removeDeployConfiguration ])
  }
  else {
    var series = baseSeries.concat([ getDeployConfiguration ])
  }

  var stashDeployConfiguration = GetSetDefault( {} )
  
  async.series( series, function onComplete ( error ) {
    if ( error ) return callback( error )
     else return callback( undefined, stashDeployConfiguration() )
  });

  function getDeployConfiguration ( step ) {
    var forSite = { siteName: unescapeSite( config.siteName ), key: config.sitekey };
    deploys.get( forSite , stepForLogConfiguration( step ) )
  }

  function setDeployConfiguration ( step ) {
    var setterOptions = {
      siteName: unescapeSite( config.siteName ),
      key: config.siteKey,
      deploy: { branch: config.branch, bucket: config.bucketName } };
    deploys.setBucket( setterOptions, stepForLogConfiguration( step ) )
  }

  function removeDeployConfiguration ( step ) {
    var removeOptions = {
      siteName: unescapeSite( config.siteName ),
      key: config.siteKey,
      bucket: config.bucketName,
    }
    deploys.removeBucket( removeOptions, stepForLogConfiguration( step ) )
  }

  function stepForLogConfiguration ( step ) {
    return function logConfiguration ( error, deployConfiguration ) {
      if ( error ) return callback( error )

      var deploys = [];
      if ( Array.isArray( deployConfiguration ) ) deploys = deployConfiguration
      else deploys = deployConfiguration.deploys

      console.log( 'Deploys:\n---' )
      deploys.forEach( function displayDeployConfiguration ( deploy ) {
        console.log( 'URL & bucket: ' + deploy.bucket );
        console.log( 'Git branch:   ' + deploy.branch );
        console.log( '---' )
      } )

      stashDeployConfiguration( deployConfiguration )

      step();
    }
  }

}

function GetSetDefault ( defaultValue ) {
  var value = defaultValue;
  return function ( x ) {
    if ( ! arguments.length ) return value;
    value = x;
  }
}
