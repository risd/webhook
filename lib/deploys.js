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
var firebaseLogin = require('./firebase-login');
var firebase = require('firebase');
var gitBranch = require('git-branch');
var objectAssign = require( 'object-assign' );

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

  var series = [
		ensureSiteNameAndKeyExist, authenticateFirebaseInstance, getDeployConfiguration
	];

	if ( options.bucketSet ) {
		config.bucketName = options.bucketSet;
		series = [
			ensureSiteNameAndKeyExist, authenticateFirebaseInstance, setDeployConfiguration
		]
	}

	if ( options.bucketRemove ) {
		config.bucketName = options.bucketRemove;
		series = [
			ensureSiteNameAndKeyExist, authenticateFirebaseInstance, removeDeployConfiguration
		]
	}

  firebaseLogin.setFirebaseName( config.firebaseName );

  var firebaseRoot = new firebase( 'https://' + config.firebaseName + '.firebaseio.com' );

  var user = User( firebaseRoot )
  var deploys = Deploys( firebaseRoot.child( 'buckets' ) )
  
  async.series( series, function onComplete () {
	    process.exit(0);
	  });

 	function ensureSiteNameAndKeyExist (step) {

		if ( config.sitename && config.sitekey ) {
			return step();
		}

		try {
			var json = JSON.parse(fs.readFileSync('.firebase.conf'));
	    config.sitename = json.siteName;
	    config.sitekey = json.secretKey;
		} catch ( error ) {
			error.message = [
			  "No `sitename` or `sitekey` found."
			].join(' ')
			return callback( error )
		}
	  step();

	}

	function authenticateFirebaseInstance ( step ) {

	  if( config.firebaseToken ) {
	    firebaseRoot.auth( config.firebaseToken, function ( error ) {
	    	// token is expired
	    	if ( error ) promptForToken( step )
	  		// Firebase instance is now authenticated,
	  		// we can now use it to interact with deploys data
	    	else step();
	    } )

	  } else {
	  	promptForToken( step )
	  }

	  function promptForToken ( substep ) {
	  	user.getUserLoginInformation( 'risd.systems', function ( error, credentials ) {
	  		if ( error ) return callback( error )

	  		config.webhookUsername = credentials.webhookUsername;
		  	config.webhookPassword = credentials.webhookPassword;
	  		
	    	user.firebaseLoginOrCreateUser( config, function ( error, updatedConfig ) {
	    		if ( error ) return callback( error )
	    		config = objectAssign( config, updatedConfig )
	    		// Firebase instance is now authenticated,
	    		// we can now use it to interact with deploys data
	    		substep()
	    	} )
	    })
	  }
	}

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





