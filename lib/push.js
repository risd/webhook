'use strict';
require('colors');

var fs    = require('fs');
var path  = require('path');
var async = require('async');
var url = require('url');
var axios = require( 'axios' )
var FormData = require( 'form-data' )
var winSpawn = require('win-spawn');
var wrench   = require('wrench');
var mime = require('mime');
mime.define( { 'application/x-gtar': [ 'tgz' ] } )

var ensureSiteNameAndKeyExist = require( './util/ensure-site-name-and-key-exist' )
var runBuild = require( './util/run-build' )
var runAssetsBuild = require( './util/run-assets-build' )
var exitCallback = require( './util/exit-callback' )
var createArchive = require( './util/deploy-archive' ).create

var gitBranch = require( './util/git-branch' );


module.exports = function Push (options, callback) {
  if ( typeof callback !== 'function' ) callback = exitCallback;

  // Set of basic configuration for this (Defaults)
  var config = {
    custom: options.server || false,
    server: options.server,
    uploadUrl: 'http://server.webhook.com/upload/',
    siteName: options.siteName,
    siteKey: options.siteKey,
    branch: options.branch || gitBranch(),
    skipBuild: options.skipBuild || false,
    http: options.http || false,
    dirName: options.dirName || '.',
  };

  if(options.node || options.npm) {
    winSpawn = require('child_process').spawn;
  }

  if(config.custom) {
    var uploadUrlFor = function ( server ) {
      if ( config.server.indexOf( 'https://' ) === 0 ) server = server.replace( 'https://', '' )
      if ( config.server.indexOf( 'http://' ) === 0 ) server = server.replace( 'http://', '' )

      var protocol = config.http ? 'http' : 'https';

      return url.resolve( protocol + '://' + server, '/upload/' )
    }

    config.uploadUrl = uploadUrlFor( options.server );
  }

  var pushArchiveFileName = '.push.tgz'
  var pushArchivePath = path.join( config.dirName, pushArchiveFileName )

  var series = [ ensureSiteNameAndKeyExistStep ]

  if ( config.skipBuild === false ) series = series.concat( [ runBuildStep, runAssetsBuildStep ] )

  series = series.concat([ createZip, uploadZip ])

  async.series( series , onComplete);

  function ensureSiteNameAndKeyExistStep (step) {
    ensureSiteNameAndKeyExist ( config, step )
  }

  function runBuildStep (step) {
    runBuild( { dirName: config.dirName }, step )
  }

  function runAssetsBuildStep (step) {
    runAssetsBuild( { dirName: config.dirName }, step )
  }

  function createZip (step) {

    if(fs.existsSync( pushArchivePath ))
    {
      fs.unlinkSync( pushArchivePath );
    }

    var files = wrench.readdirSyncRecursive(config.dirName);
    var excludedPaths = ['.build', '.git', pushArchiveFileName, 'node_modules'];
    if (!config.custom)
    {
      excludedPaths = excludedPaths.concat('package.json', 'Gruntfile.js', 'libs', 'tasks', 'options');
    }

    var filesToArchive = files
      .filter( function applyExcludePaths ( file ) {
        for ( var i in excludedPaths ) {
          if ( file.indexOf( excludedPaths[ i ] ) === 0 ) {
            return false
          }
        }
        return true
      } )
      .map( function toFileSpec ( file ) {
        return {
          archivePath: file,
          localPath: path.join( config.dirName, file ),
        }
      } )
      .filter( function isNotDirectory ( file ) {
        return ! fs.lstatSync( file.localPath ).isDirectory()
      } )
      .map( function toFile ( fileSpec ) {
        return fileSpec.archivePath
      } )

    createArchive( {
        files: filesToArchive,
        cwd: config.dirName,
        archivePath: pushArchivePath,
      } )
      .then( step )
      .catch( step )
  }

  function uploadZip (step) {
    // Upload to site

    process.stdout.write('\nUploading, this might take a minute.'.blue);
    var progressIndicator = setInterval(function() {
      process.stdout.write('.');
    }, 100);

    const form = new FormData()

    form.append( 'payload', fs.readFileSync( pushArchivePath ), {
      filename: pushArchiveFileName,
      contentType: mime.getType( pushArchiveFileName ),
    } )
    form.append( 'site', config.siteName )
    form.append( 'token', config.siteKey )
    form.append( 'branch', config.branch )

    axios.post( config.uploadUrl, form, {
        headers: form.getHeaders()
      } )
      .then( function ( response ) {
        clearInterval(progressIndicator)

        const body = response.data

        if( !body || body.error ) {
          var error = body.error || 'Unknown error';
          console.log(error.red);
          return step( new Error( error ) )
        }

        console.log(body.message.green)

        step();
      } )
      .catch( function ( error ) {
        clearInterval(progressIndicator)

        step( error )
      } )
  }

  function onComplete (err, result) {
    
    if(fs.existsSync(pushArchivePath))
    {
      fs.unlinkSync(pushArchivePath);
    }

    if(err)
    {
      return callback( err )
    }

    console.log('\n========================================================'.blue);
    console.log('# Success. Your templates were deployed.'.blue);
    console.log('========================================================'.blue);
    
    callback()
  }

}
