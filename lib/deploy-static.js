'use strict';
require('colors');

var async = require( 'async' )
var path = require( 'path' )
var firebase = require( 'firebase' )
var Deploys = require( 'webhook-deploy-configuration' )

var ensureSiteNameAndKeyExist = require( './util/ensure-site-name-and-key-exist' )
var authenticateFirebaseInstance = require( './util/authenticate-firebase-instance' )

var gitBranch = require( './util/git-branch' )
var runBuild = require( './util/run-build' )
var siteDir = require( './util/site-dir' )
var purge = require( './util/cdn-purge' )

console.warn = function() {};

function firebase_unescape (str) {
  return str.replace(/,1/g, '.')
}

function exit (error) {
  return typeof error === 'undefined'
    ? process.exit(0)
    : process.exit(1);
}

module.exports = function ( options, callback ) {
  if (typeof callback !== 'function') callback = exit;
  if (typeof options !== 'object') options = {};
  var firebaseRoot = new firebase( 'https://' + options.firebaseName + '.firebaseio.com' )
  var deploys = Deploys( firebaseRoot.child('buckets') )

  var firebaseAuthOptions = {
    config: {
      firebaseToken: options.firebaseToken,
    },
    firebase: firebaseRoot,
  }

  var steps = [
    ensureSiteNameAndKeyExist(options),
    authenticateFirebaseInstance(firebaseAuthOptions)
  ];

  var staticFolder = StaticFolder( options.staticFolder )
  if ( staticFolder.shouldBuild() ) steps = steps.concat( [ runBuild ] )

  var deployBuckets = GetSetDefaultArray()
  if ( options.siteName ) {
    deployBuckets( [ options.siteName ] )
  }
  else {
    var getDeploysOptions = function () {
      return {
        siteName: firebase_unescape( options.sitename ),
        key: options.sitekey,  
      }
    }

    var setDeployBucketsWithDeploys = function ( deploys ) {
      var branch = options.branch || gitBranch()
      var buckets = deploys
        .filter( function ( deploy ) { return deploy.branch === branch } )
        .map( function ( deploy ) { return deploy.bucket } )
      deployBuckets( buckets )
    }

    steps = steps.concat( [ getDeployConfiguration( getDeploysOptions, setDeployBucketsWithDeploys ) ] )
  }

  var pushDirectoryOptions = function () {
    return deployBuckets().map( function ( bucket ) {
      return {
        siteName: bucket,
        directory: staticFolder.is(),
        directoryPrefix: options.staticPrefix,
        keyFile: options.gcloud,
        debug: options.debug,
      }
    } )
  }

  steps = steps.concat( [ pushDirectory ] )
  
  return async.series( steps, function onComplete ( error ) {
    if ( error ) return callback( error )
    else return callback( undefined, pushDirectoryOptions() )
  } )

  function getDeployConfiguration ( optionsFn, successFn ) {
    return function getDeployConfigurationStep ( step ) {
      deploys.get( optionsFn(), function ( error, deployConfiguration ) {
        if ( error ) return step( error )
        successFn( deployConfiguration.deploys )
        step()
      } )
    }
  }

  function pushDirectory ( step ) {
    var uploader = function ( uploadOptions ) {
      return function ( substep ) {
        siteDir( uploadOptions, substep )
      }
    }

    async.series( pushDirectoryOptions().map( uploader ), step )
  }
}

function GetSetDefaultArray () {
  var value = [];
  return function ( x ) {
    if ( ! arguments.length ) return value;
    value = x;
  }
}

function StaticFolder (folderPath) {
  var runBuildProcess = false;

  if ( ! folderPath ) {
    var defaultBuildFolder = path.join( process.cwd(), '.build' )
    folderPath = defaultBuildFolder;
    runBuildProcess = true;
  }

  return {
    is: function () { return folderPath },
    shouldBuild: function () { return runBuildProcess },
  }
}
