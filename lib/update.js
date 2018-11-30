'use strict';

require( 'colors' )

var fs    = require( 'fs' )
var async = require( 'async' )
var request  = require( 'request' )
var inquirer = require( 'inquirer' )
var wrench = require( 'wrench' )
var _ = require( 'lodash' )
var tar = require( 'tar' )

var ensureSiteNameAndKeyExistStep = require( './util/ensure-site-name-and-key-exist' ).step
var downloadGenerate = require( './util/download-generate' )
var runGruntInit = require( './util/run-grunt-init' )
var runNpmInstallFn = require( './util/run-npm-install' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )

module.exports = function Update ( options, callback ) {
  if ( typeof callback !== 'function' ) callback = exitCallback;

  var config = {
    generate: options.generate,
    imgix_host: options.imgix_host || null,
    imgix_secret: options.imgix_secret || null,
    siteName: undefined,
    siteKey: undefined,
  }

  var configFn = functor( config )
  
  async.series([
    acceptTermsStep,
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
    downloadStep,
    extractStep,
    initializeStep,
  ], updatedHandler )

  function updatedHandler ( error ) {
    if ( error ) return callback( error )

    console.log('========================================================'.blue);
    console.log('# Update complete                                      #'.blue);
    console.log('========================================================'.blue);
    console.log('#'.blue + ' We updated your local copy.');
    console.log('#'.blue + ' Run ' + 'wh deploy'.cyan + ' to deploy your changes live.')
    console.log('# ---------------------------------------------------- #\n'.blue)
    
    callback()
  }

  function acceptTermsStep (step) {
    if(options.force === 'true') {
      step();
      return;
    }

    inquirer.prompt({
      type: 'confirm',
      name: 'confirm',
      message: 'This may modify your package.json file. Proceed?'
    }, function(answer) {
      if(answer.confirm) {
        step();
      } else {
        process.exit(0);
      }
    });
  }

  function downloadStep ( step ) {
    // Download the repo to temp folder
    downloadGenerate( config.generate, function (error, downloadedGenerate) {
      if (error) {
        console.log('No repository found at '.red + config.generate.blue);
        return step( error )
      }

      config.downloadedGenerate = downloadedGenerate;
      step()
    } );
  }

  function extractStep ( step ) {
    console.log('Extracting...'.magenta);

    if(fs.existsSync('node_modules')) {
      wrench.rmdirSyncRecursive('node_modules');
    }

    var updatePackage = PackageUpdate( 'package.json' )

    fs.createReadStream( config.downloadedGenerate )
      .pipe( tar.extract( {
        filter: filterTar( 'package', [ 'libs', 'options', 'tasks', 'package.json' ] ),
        strip: 1,
      } ) )
      .on( 'error', step )
      .on( 'finish', handleExtract )


    function handleExtract () {
      updatePackage.with( 'package.json' )
      updatePackage.write( 'package.json' )
      fs.unlinkSync( config.downloadedGenerate )
      step()
    }
  }

  function initializeStep ( step ) {
    var runNpmInstall = runNpmInstallFn( options )
    
    runNpmInstall(function() {
      runGruntInit(Object.assign( {}, options, config ), step);
    });
  }
}

// store package.json
// add another, update dependencies of the original one
// write out package.json
function PackageUpdate ( packagePath ) {
  var packageObj = readJson( packagePath )

  return {
    with: updateWith,
    write: writeFile
  }

  function updateWith ( updatePackagePath ) {
    var updatePackage = readJson( updatePackagePath )
    _.assign( packageObj.devDependencies || {}, updatePackage.devDependencies )
    _.assign( packageObj.dependencies, updatePackage.dependencies )
    _.assign( packageObj.scripts, updatePackage.scripts )
  }

  function writeFile ( writeToPath ) {
    fs.writeFileSync( writeToPath, JSON.stringify( packageObj, null, "  " ) )
  }

  function readJson ( filePath ) {
    return JSON.parse( fs.readFileSync( filePath ) )
  }
}

// basePath : string, paths: [string] => ( extractPath : string, entry ) => include : boolean
function filterTar ( basePath, paths ) {
  var path = require( 'path' )
  return function tarFilter ( extractPath, entry ) {
    var include = false;
    for (var i = paths.length - 1; i >= 0; i--) {
      var includePath = path.join( basePath, paths[ i ] )
      if ( extractPath.startsWith( includePath ) ) include = true;
    }
    return include;
  }
}