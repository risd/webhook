'use strict';
require('colors');

var fs    = require('fs');
var path  = require('path');
var archiver   = require('archiver');
var async = require('async');
var url = require('url');
var request  = require('request');
var winSpawn = require('win-spawn');
var wrench   = require('wrench');
var mime = require('mime');

var ensureSiteNameAndKeyExist = require( './util/ensure-site-name-and-key-exist' )
var runBuild = require( './util/run-build' )
var runAssetsBuild = require( './util/run-assets-build' )

var gitBranch = require( './util/git-branch' );


module.exports = function Push (options) {

  // Set of basic configuration for this (Defaults)
  var config = {
    custom: options.server || false,
    server: options.server,
    uploadUrl: 'http://server.webhook.com/upload/',
    siteName: null,
    siteKey: null,
    branch: options.branch || gitBranch(),
    skipBuild: options.skipBuild || false,
    http: options.http || false,
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

  var series = [ ensureSiteNameAndKeyExistStep ]

  if ( config.skipBuild === false ) series = series.concat( [ runBuildStep ] )

  series = series.concat([ runAssetsBuildStep, createZip, uploadZip ])

  async.series( series , onComplete);

  function ensureSiteNameAndKeyExistStep (step) {
    ensureSiteNameAndKeyExist ( config, step )
  }

  function runBuildStep (step) {
    runBuild( step )
  }

  function runAssetsBuildStep (step) {
    runAssetsBuild( step )
  }

  function createZip (step) {
    // Zip up repo
    zipFile = new archiver.create('zip');

    if(fs.existsSync('.push.zip'))
    {
      fs.unlinkSync('.push.zip');
    }

    var output = fs.createWriteStream('./.push.zip');
    zipFile.pipe(output);

    var alreadyAdded = {};


    if(fs.existsSync('.whdist')) {
      var distFiles = wrench.readdirSyncRecursive('.whdist');

      distFiles.forEach(function(file) {
        if(!fs.lstatSync('.whdist/' + file).isDirectory())
        {
          zipFile.file('.whdist/' + file, { name:  file });
          alreadyAdded[file] = true;
        }
      });
    }

    var files = wrench.readdirSyncRecursive('.');
    var excludedPaths = ['.build/', '.git', '.whdist', '.push.zip', 'node_modules', '.wh-original'];
    if (!config.custom)
    {
      excludedPaths = excludedPaths.concat('package.json', 'node_modules', 'Gruntfile.js', 'libs', 'tasks', 'options');
    }
    
    files.forEach(function(file) {
      for(var i in excludedPaths)
      {
        if(file.indexOf(excludedPaths[i]) === 0)
        {
          return;
        }
      }

      if(!fs.lstatSync(file).isDirectory() && !alreadyAdded[file])
      {
        zipFile.file(file, { name:  file });
      }

      if(!fs.lstatSync(file).isDirectory() && alreadyAdded[file]) {
        zipFile.file(file, { name: '.wh-original/' + file });
      }
    });

    zipFile.on('error', function(err) {
      throw err;
    });

    output.on('close', function() {
      // Remove Dist Here
      if(fs.existsSync('.whdist')) {
        wrench.rmdirSyncRecursive('.whdist');
      }
     
      step();
    });

    zipFile.finalize();
  }

  function uploadZip (step) {
    // Upload to site

    process.stdout.write('\nUploading, this might take a minute.'.blue);
    var interval = setInterval(function() {
      process.stdout.write('.');
    }, 100);
    request({
        url: config.uploadUrl,
        headers: {
            'content-type' : 'multipart/form-data'
        },
        method: 'POST',
        multipart: [{
            'Content-Disposition' : 'form-data; name="payload"; filename="' + path.basename('.push.zip') + '"',
            'Content-Type' : mime.lookup('.push.zip'),
            body: fs.readFileSync('.push.zip')
        },{
            'Content-Disposition' : 'form-data; name="site"',
            body: config.siteName
        },{
            'Content-Disposition' : 'form-data; name="token"',
            body: config.siteKey
        },{
            'Content-Disposition' : 'form-data; name="branch"',
            body: config.branch
        }]
    },
    function(err, res, body){

      if ( err ) {
        console.log( err )
        console.log( res )
        step()
        process.exit(1)
      }

      clearInterval(interval);
      try {
        body = JSON.parse(body);  
      } catch ( error ) {
        console.log( 'Could not parse body as JSON.' )
        console.log( error )
        step()
        process.exit(1)
      }
      

      if(!body || body.error)
      {
        var error = body.error || 'Unknown error';
        console.log(error.red);
        process.exit(1);
      }

      console.log(body.message.green);
      step();
    });
  }

  function onComplete (err, result) {

    if(fs.existsSync('.push.zip'))
    {
      fs.unlinkSync('.push.zip');
    }

    if(err)
    {
      console.log(err.red);
      return;
    }

    console.log('\n========================================================'.blue);
    console.log('# Success. Your templates were deployed.'.blue);
    console.log('========================================================'.blue);

    if(!config.custom) {
      console.log('# Find your site at '.blue + 'http://'.cyan + config.siteName.cyan + '.webhook.org'.cyan);
      console.log('# ---------------------------------------------------- #'.blue)
    }
    
    process.exit(0);
  }

};


function runInDir(command, cwd, args, callback) {
  var spawnedCommand = winSpawn(command, args, {
    stdio: 'inherit',
    cwd: cwd
  });

  spawnedCommand.on('error', function() {
    console.log('There was an error trying to run this command'.red);
    console.log('Please make sure you have grunt installed'.red);
  });

  spawnedCommand.on('close', function(exit, signal) {

    if(exit === 0) {
      callback(null);
    } else {
      callback(exit);
    }

  });
}
