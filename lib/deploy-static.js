'use strict';

var async = require( 'async' )
var path = require( 'path' )
var gcloudSiteDir = require( 'gcloud-site-dir' )

require('colors');

var objectAssign = require( 'object-assign' );

var runBuild = require('./util.js').runBuild;

console.warn = function() {};

function exit (error) {
  return typeof error === 'undefined'
    ? process.exit(0)
    : process.exit(1);
}

module.exports = function ( options, callback ) {
  if (typeof callback !== 'function') callback = exit;
  if (typeof options !== 'object') options = {};

  var pushDirectoryOptions = {
    siteName: options.siteName,
    directory: options.buildFolder || path.join( process.cwd(), '.build' ),
    keyFile: options.gcloud,
  }

  var steps = [];
  if ( !options.buildFolder ) steps = steps.concat( [ runBuild ] )
  steps = steps.concat( [ pushDirectory ] )
  
  return async.series( steps, function onComplete ( error ) {
    if ( error ) return callback( error )
    else return callback()
  } )

  function pushDirectory ( step ) {
    gcloudSiteDir( pushDirectoryOptions, step )
  }
}
