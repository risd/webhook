'use strict';

var fs  = require('fs');

require('colors');

console.warn = function() {};
var request = require('request');
var firebaseRoot = null;

var exitCallback = require( './util/exit-callback' )

module.exports = function Notifier (version, callback) {
  if (typeof callback !== 'function') callback = exitCallback;

  var notSupportedMessage = `Notifier is currently deprecated.
    Notifier was used under webhook/wh, although the open
    source implementation of webhook/webhook-server-open did
    not include security rules that allowed for this.
    Not sure its worth implementing, since there is a relationship
    between this tool & webhook-generate.
    For now, the @risd forks of these repositories will not support
    the Notifier.`
  console.log( notSupportedMessage )
  return callback( new Error( notSupportedMessage ) )

  // Set of basic configuration for this (Defaults)
  var config = {
    firebaseName: 'webhook',
  };

  firebaseRoot = 'https://' + config.firebaseName + '.firebaseio.com/install_version.json';

  request({ url : firebaseRoot, json: true }, function(e, r, body) {
    if(body) {
      if(body !== version) {
        console.log('========================================================'.red);
        console.log('# Your Webhook command line tools are out of date.     #'.red);
        console.log('========================================================'.red);
        console.log('#'.red + ' Update by running:');
        console.log('#'.red + ' npm install -g wh');
        console.log('# ---------------------------------------------------- #\n'.red);
      }

      callback();
    } else {
      callback();
    }
  });
};
