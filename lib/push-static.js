'use strict';
require('colors');

var request = require( 'request' )
var getGitBranch = require( './util/git-branch' )
var siteDir = require( './util/site-dir' )

module.exports = function PushStatic ( options, callback ) {
  if (typeof callback !== 'function') callback = exit;
  if (typeof options !== 'object') options = {};
  var debug = options.debug || false;

  var steps = [];

  options.branch = options.branch || getGitBranch()

  var pushOptions = {
    keyFile: options.gcloud,
    siteName: makeBranchBasedSiteName( options.baseDomain, options.branch ),
    directory: options.staticFolder,
    directoryPrefix: options.staticPrefix,
    debug: debug,
  }

  if ( debug ) {
    console.log( 'push-static:options' )
    console.log( pushOptions )
  }
  
  siteDir( pushOptions, callback )

  function exit (error) {
    if ( ! error ) console.log( ''+
      'Successfully uploaded directory to site.' +
      '\nDirectory: ' + pushOptions.directory +
      '\nSite:      ' + pushOptions.siteName +
      '\nSite path: ' + ( pushOptions.directoryPrefix ? pushOptions.directoryPrefix : '/' ) );
    if ( error && debug ) console.log( error )
    return error === null
      ? process.exit(0)
      : process.exit(1);
  }
}

function makeBranchBasedSiteName ( domain, branch ) {
  return branch === 'master' || branch === 'main'
    ? domain
    : [ branchAsSubdomain( branch ), domain ].join( '.' )
}

function branchAsSubdomain ( branch ) {
  return branch
    .replace( /^release\//g, '' )   // release/r-15 -> r-15
    .replace( /^feature\//g, 'f-' ) // feature/firebase-upgrade -> f-firebase-upgrade
    .replace( /^hotfix\//g,  'h-' ) // hotfix/template-patch -> h-template-patch
    .replace( /\//g, '-' )          // replace '/' with '-'
    .replace( /\+/g, '-' )          // replace '+' with '-'
}
