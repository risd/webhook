'use strict';

require('colors');

var async = require('async');
var firebase = require('firebase');
var util = require('./util.js');

console.warn = function() {};

function exit (error) {
  return typeof error === 'undefined'
    ? process.exit(0)
    : process.exit(1);
}

/**
 * Send domain mapping signal to the server
 * 
 * @param  {object}   options
 * @param  {string}   options.maskDomain      The mask domain to set or remove
 * @param  {string}   options.contentDomain?  If present, the content domain to set as the source for the mask domain
 * @param  {Function} callback [description]
 */
module.exports = function ( options, callback ) {
  if (typeof callback !== 'function') callback = exit;
  if (typeof options !== 'object') options = {};

  // get config is the default
  var config = {
    sitename: options.sitename || null,
    sitekey: options.sitekey || null,
    webhookUsername: options.webhookUsername || null,
    firebaseName: options.firebaseName || 'webhook',
    maskDomain: options.maskDomain,
    contentDomain: options.contentDomain,
  };

  var firebaseRoot = new firebase( 'https://' + config.firebaseName + '.firebaseio.com' );

  // Series of tasks to push the command to the server
  // The first two steps update the config object above
  // The final step pushes the command to the firebase
  var series = [
    util.ensureSiteNameAndKeyExist( config ), // adds { sitename, sitekey }
    util.authenticateFirebaseInstance( { config: config, firebase: firebaseRoot } ), // adds { webhookUsername, webhookPassword }
    pushDomainMapTask,
  ];
  
  async.series( series, function onComplete ( error, results ) {
    if ( error ) return callback( error )
    else return callback( undefined, results[ results.length - 1 ] )
  } );

  function pushDomainMapTask ( taskComplete ) {

    var data = {
      id: util.uniqueId(),
      sitename: config.sitename,
      userid: config.webhookUsername,
      maskDomain: config.maskDomain,
    }

    if ( config.contentDomain ) data.contentDomain = config.contentDomain;

    firebaseRoot.root().child( 'management/commands/domainMap/' + data.sitename ).set( data, function ( error ) {
      if ( error ) {
        console.log( error )
        console.log( error.message )
        console.log( error.stack )
        return callback( error )
      }

      if ( config.contentDomain ) var msg = `Signaled server to set ${ config.maskDomain } to pull content from ${ config.contentDomain }`
      else var msg = `Signaled server to remove the domain ${ config.maskDomain } from content mapping configuration.`
      
      console.log( msg )
      
      callback( null, data )
    } )
   }
}
