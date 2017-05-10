'use strict';

var fs    = require('fs');
var Zip   = require('adm-zip');
var async = require('async');

require('colors');

var request  = require('request');
var winSpawn = require('win-spawn');
var inquirer = require('inquirer');
var wrench = require('wrench');
var _ = require('lodash');
var firebase = require('firebase');
var gitBranch = require('git-branch');
var objectAssign = require( 'object-assign' );

var util = require('./util.js');
var User = require('./user.js');
var Deploys = require( 'webhook-deploy-configuration' );

console.warn = function() {};

function firebase_escape (str) {
  return str.replace(/\./g, ',1');
}

function firebase_unescape (str) {
  return str.replace(/,1/g, '.');
}

function exit (error) {
  return typeof error === 'object' 
    ? process.exit(1)
    : process.exit(0);
}

function defaultBranch () {
  var branch = null;
	try {
    branch = gitBranch.sync()
	} catch ( error ) {
    branch = Deploys.utilities.defaultBranch()
  }
  return branch;
}


module.exports = function ( options, callback ) {
  if (typeof callback !== 'function') callback = exit;
  if (typeof options !== 'object') options = {};

  // get config is the default
  var config = {
    sitename: options.sitename || null,
    sitekey: options.sitekey || null,
    firebaseName: options.firebaseName || 'webhook',
    firebaseToken: options.firebaseToken || null,
    webhookUsername: options.email ? options.email.toLowerCase() : null,
    webhookPassword: '',
    branch: options.branch || defaultBranch()
  };

  var firebaseRoot = new firebase( 'https://' + config.firebaseName + '.firebaseio.com' );
  var deploys = Deploys( firebaseRoot.child( 'buckets' ) )

  var baseSeries = [
		util.ensureSiteNameAndKeyExist(config),
    util.authenticateFirebaseInstance( { config: config, firebase: firebaseRoot } )
	];

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
  
  async.series( series, function onComplete ( error ) {
      if ( error ) return callback( error )
       else return callback()
	  });

	function getDeployConfiguration ( step ) {
		var forSite = { siteName: firebase_unescape( config.sitename ), key: config.sitekey };
		deploys.get( forSite , stepForLogConfiguration( step ) )
	}

	function setDeployConfiguration ( step ) {
		var setterOptions = {
			siteName: firebase_unescape( config.sitename ),
			key: config.sitekey,
			deploy: { branch: config.branch, bucket: config.bucketName } };
		deploys.setBucket( setterOptions, stepForLogConfiguration( step ) )
	}

	function removeDeployConfiguration ( step ) {
		var removeOptions = {
			siteName: firebase_unescape( config.sitename ),
			key: config.sitekey,
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
			step();
		}
	}

}





