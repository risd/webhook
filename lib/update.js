'use strict';

require( 'colors' )

var fs    = require( 'fs' )
var path = require( 'path' )
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
var getGenerateVersionStep = require( './util/npm-view-version' ).step
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )
var escapeSite = require( './util/escape-site' )

module.exports = function Update ( options, callback ) {
  if ( typeof callback !== 'function' ) callback = exitCallback;

  var config = {
    generate: options.generate,
    generateVersion: undefined,
    siteName: escapeSite( options.siteName ),
    siteKey: options.siteKey,
    force: options.force,
    platformName: options.platformName,
    dirName: options.dirName || '.',
  }

  var configFn = functor( config )
  
  async.series([
    acceptTermsStep,
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
    downloadStep,
    getGenerateVersionStep.bind( null, configFn ),
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
    if(config.force === 'true' || config.force === true) {
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

    var packagePath = path.join( config.dirName, 'package.json' )
    var updatePackage = PackageUpdate( config.platformName, packagePath )

    fs.createReadStream( config.downloadedGenerate )
      .pipe( tar.extract( {
        cwd: config.dirName,
        filter: filterTar( 'package', [ 'libs', 'options', 'tasks', 'package.json' ] ),
        strip: 1,
      } ) )
      .on( 'error', step )
      .on( 'finish', handleExtract )


    function handleExtract () {
      var platformUpdate = {}
      platformUpdate[ config.platformName ] = { generate: config.generateVersion }
      updatePackage.with( platformUpdate )
      updatePackage.with( packagePath )
      updatePackage.write( packagePath )
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
function PackageUpdate ( platformName, packagePath ) {
  var packageObj = readJson( packagePath )

  if ( ! packageObj[ platformName ] ) packageObj[ platformName ] = {}
  if ( ! packageObj.devDependencies ) packageObj.devDependencies = {}
  if ( ! packageObj.dependencies ) packageObj.dependencies = {}
  if ( ! packageObj.scripts ) packageObj.scripts = {}

  return {
    with: updateWith,
    write: writeFile
  }

  function updateWith ( updatePackagePath ) {
    var updatePackage = readJson( updatePackagePath )
    _.merge( packageObj[ platformName ], updatePackage[ platformName ] || {} )
    _.assign( packageObj.devDependencies, updatePackage.devDependencies || {} )
    _.assign( packageObj.dependencies, updatePackage.dependencies )
    _.assign( packageObj.scripts, updatePackage.scripts )
  }

  function writeFile ( writeToPath ) {
    fs.writeFileSync( writeToPath, JSON.stringify( packageObj, null, "  " ) )
  }

  function readJson ( filePath ) {
    if ( typeof filePath === 'object' && filePath !== null ) return filePath;
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