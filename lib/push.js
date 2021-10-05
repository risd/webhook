'use strict';
require('colors');

var fs    = require('fs');
var path  = require('path');
var archiver   = require('archiver');
var async = require('async');
var url = require('url');
var axios = require( 'axios' )
var FormData = require( 'form-data' )
var winSpawn = require('win-spawn');
var wrench   = require('wrench');
var mime = require('mime');

var ensureSiteNameAndKeyExist = require( './util/ensure-site-name-and-key-exist' )
var runBuild = require( './util/run-build' )
var runAssetsBuild = require( './util/run-assets-build' )
var exitCallback = require( './util/exit-callback' )

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

  var zipFile = null;
  var pushZipPath = path.join( config.dirName, '.push.zip' )

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
    // Zip up repo
    zipFile = new archiver.create('zip');


    if(fs.existsSync( pushZipPath ))
    {
      fs.unlinkSync( pushZipPath );
    }

    var output = fs.createWriteStream(pushZipPath);
    zipFile.pipe(output);

    var alreadyAdded = {};


    var whDistPath = path.join( config.dirName, '.whdist' )
    if(fs.existsSync(whDistPath)) {
      var distFiles = wrench.readdirSyncRecursive(whDistPath);

      distFiles.forEach(function(file) {
        var whDistFilePath = path.join( whDistPath, file )
        if(!fs.lstatSync(whDistFilePath).isDirectory())
        {
          zipFile.file(whDistFilePath, { name:  file });
          alreadyAdded[file] = true;
        }
      });
    }

    var files = wrench.readdirSyncRecursive(config.dirName);
    var excludedPaths = ['.build/', '.git', '.whdist', '.push.zip', 'node_modules', '.wh-original'];
    if (!config.custom)
    {
      excludedPaths = excludedPaths.concat('package.json', 'node_modules', 'Gruntfile.js', 'libs', 'tasks', 'options');
    }

    files
      .filter( function ( file ) {
        for ( var i in excludedPaths ) {
          if ( file.indexOf( excludedPaths[ i ] ) === 0 ) {
            return false
          }
        }
        return true
      } )
      .map( function ( file ) {
        return {
          zipPath: file,
          localPath: path.join( config.dirName, file ),
        }
      } )
      .forEach(function(file) {
        if(!fs.lstatSync(file.localPath).isDirectory() && !alreadyAdded[file.zipPath])
        {
          zipFile.file(file.localPath, { name:  file.zipPath });
        }

        if(!fs.lstatSync(file.localPath).isDirectory() && alreadyAdded[file.zipPath]) {
          var whOriginalPath = path.join( '.wh-original', file.zipPath )
          zipFile.file(file.localPath, { name: whOriginalPath });
        }
      });

    zipFile.on('error', function(err) {
      throw err;
    });

    output.on('close', function() {
      // Remove Dist Here
      if(fs.existsSync(whDistPath)) {
        wrench.rmdirSyncRecursive(whDistPath);
      }
     
      step();
    });

    zipFile.finalize();
  }

  function uploadZip (step) {
    // Upload to site

    process.stdout.write('\nUploading, this might take a minute.'.blue);
    var progressIndicator = setInterval(function() {
      process.stdout.write('.');
    }, 100);

    const form = new FormData()

    form.append( 'payload', fs.readFileSync( pushZipPath ), {
      filename: '.push.zip',
      contentType: mime.lookup( '.push.zip' ),
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
    
    if(fs.existsSync(pushZipPath))
    {
      fs.unlinkSync(pushZipPath);
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
