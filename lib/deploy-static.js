'use strict';

require('colors');

var async = require( 'async' )
var path = require( 'path' )
var Deploys = require( 'webhook-deploy-configuration' )

var Firebase = require( './util/firebase/index' )

var unescape = require( './util/unescape-site' )
var gitBranch = require( './util/git-branch' )
var runBuild = require( './util/run-build' )
var siteDir = require( './util/site-dir' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )


/**
 * Use deploy configuration to determine where to push files.
 * 
 * @param  {object}   options
 * @param  {Function} callback
 */
module.exports = function DeployStatic ( options, callback ) {
  if (typeof callback !== 'function') callback = exitCallback;

  var firebase = Firebase( options )

  var config = {
    siteName: options.siteName,
    siteKey: null,
    staticPrefix: options.staticPrefix,
    staticFolder: options.staticFolder,
    gcloud: options.gcloud,
    debug: options.debug,
    branch: options.branch,
  }
  
  var configFn = functor( config )

  var deploys = Deploys( firebase.database() )

  var steps = [
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
  ];

  var staticFolder = StaticFolder( config.staticFolder )
  if ( staticFolder.shouldBuild() ) steps = steps.concat( [ runBuild ] )

  var deployBuckets = GetSetDefaultArray()
  if ( config.siteName ) {
    deployBuckets( [ config.siteName ] )
  }
  else {
    var getDeploysOptions = function () {
      return {
        siteName: unescape( config.siteName ),
        key: config.siteKey,
      }
    }

    var setDeployBucketsWithDeploys = function ( deploys ) {
      var branch = config.branch || gitBranch()
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
        directoryPrefix: config.staticPrefix,
        keyFile: config.gcloud,
        debug: config.debug,
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
