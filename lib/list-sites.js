'use strict';
require('colors')

var async = require( 'async' )
var inquirer = require( 'inquirer' )
var firebase = require( 'firebase' )

var authenticateFirebaseInstance = require( './util/authenticate-firebase-instance' )

var escapeUsername = require( './util/escape-site' )

var firebaseRoot = null;

module.exports = function ListSites (options, callback) {

  var config = {
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookPassword: '',
    firebaseName: options.firebaseName || 'webhook',
    firebaseToken: options.token || '',
  };

  firebaseRoot = new firebase('https://' + config.firebaseName + '.firebaseio.com/management');

  async.series([
    authenticateFirebaseInstance( { config: config, firebase: firebaseRoot } ),
    listSitesStep,
  ], function () {

    console.log('')
    process.exit(0);

  });
  
  function authenticateInstanceStep (step) {
    firebaseRoot.auth(config.firebaseToken, function(error, auth) {
      if(error) {
        process.exit(2);
      }
      
      step();
    });
  }

  function listSitesStep (step) {
    firebaseRoot.child('users/' + escapeUsername( config.webhookUsername ) + '/sites').once('value', function(snap) {
      var ownedSites = [];
      var userSites = [];
      var val = snap.val();

      if(val.owners) {
        console.log('');
        console.log('The Webhook sites I\'m an owner of:'.green);
        for(var site in val.owners) {
          console.log(site);
        }
      }
      if(val.users) {
        console.log('');
        console.log('The Webhook sites I\'m a user of:'.blue);
        for(var site in val.users) {
          console.log(site);
        }
      }

      if(!val.users && !val.owners) {
        console.log('Not an owner or user for any site'.red);
      }
      step();
    });

  }
};
