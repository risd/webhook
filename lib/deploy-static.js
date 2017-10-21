'use strict';

var async = require( 'async' )
var path = require( 'path' )
var firebase = require( 'firebase' )
var gcloudSiteDir = require( 'gcloud-site-dir' )
var Deploys = require( 'webhook-deploy-configuration' )
var util = require('./util')

require('colors');

var objectAssign = require( 'object-assign' );

var runBuild = require('./util.js').runBuild;

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

  var getDeploysOptions = function () {
    return {
      siteName: firebase_unescape( options.sitename ),
      key: options.sitekey,  
    }
  }

  var deployBuckets = GetSetDefaultArray()

  var setDeployBucketsWithDeploys = function ( deploys ) {
    var branch = options.branch || util.gitBranch()
    var buckets = deploys
      .filter( function ( deploy ) { return deploy.branch === branch } )
      .map( function ( deploy ) { return deploy.bucket } )
    deployBuckets( buckets )
  }

  var staticFolder = StaticFolder( options.staticFolder )

  var pushDirectoryOptions = function () {
    return deployBuckets().map( function ( bucket ) {
      return {
        siteName: bucket,
        directory: staticFolder.is(),
        directoryPrefix: options.staticPrefix,
        keyFile: options.gcloud,
      }
    } )
  }

  var steps = [
    util.ensureSiteNameAndKeyExist(options),
    util.authenticateFirebaseInstance(firebaseAuthOptions)
  ];
  if ( staticFolder.shouldBuild() ) steps = steps.concat( [ runBuild ] )
  steps = steps.concat( [ getDeployConfiguration, pushDirectory ] )
  
  return async.series( steps, function onComplete ( error ) {
    if ( error ) return callback( error )
    else return callback()
  } )

  function getDeployConfiguration ( step ) {
    deploys.get( getDeploysOptions(), function ( error, deployConfiguration ) {
      if ( error ) return step( error )
      setDeployBucketsWithDeploys( deployConfiguration.deploys )
      step()
    } )
  }

  function pushDirectory ( step ) {
    var uploader = function ( options ) {
      return function ( substep ) {
        gcloudSiteDir( options, substep )
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
  var runBuild = false;

  if ( ! folderPath ) {
    var defaultBuildFolder = path.join( process.cwd(), '.build' )
    folderPath = defaultBuildFolder;
    runBuild = true;
  }

  return {
    is: function () { return folderPath },
    shouldBuild: function () { return runBuild },
  }
}
