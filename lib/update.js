'use strict';

require( 'colors' )

var fs    = require( 'fs' )
var Zip   = require( 'adm-zip' )
var async = require( 'async' )
var request  = require( 'request' )
var inquirer = require( 'inquirer' )
var wrench = require( 'wrench' )
var _ = require( 'lodash' )

var ensureSiteNameAndKeyExistStep = require( './util/ensure-site-name-and-key-exist' ).step
var runGruntInit = require( './util/run-grunt-init' )
var runNpmInstallFn = require( './util/run-npm-install' )
var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )

module.exports = function Update ( options, callback ) {
  if ( typeof callback !== 'function' ) callback = exitCallback;

  var config = {
    generate: options.generate || 'http://dump.webhook.com/static/generate-repo.zip',
    imgix_host: options.imgix_host || null,
    imgix_secret: options.imgix_secret || null,
    siteName: undefined,
    siteKey: undefined,
  }

  var configFn = functor( config )
  
  async.series([
    acceptTermsStep,
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
    updateStep,
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

  function updateStep ( step ) {
    // Download the repo to temp folder
    downloadUpdateRepo(config, function (error, zipFile) {
      if (error) {
        console.log('No repository found at '.red + config.baseGit.blue);
        return process.exit(1);
      }

      // Extract files here
      var zip = new Zip(zipFile);

      console.log('Extracting...'.magenta);

      if(fs.existsSync('node_modules')) {
        wrench.rmdirSyncRecursive('node_modules');
      }

      zip.getEntries().forEach(function(entry) {
        var name = entry.entryName;

        if(name.indexOf('libs/') === 0 || name.indexOf('options/') === 0 || name.indexOf('tasks/') === 0 ) {
           zip.extractEntryTo(entry.entryName, '.', true, true);
        }

        if(name.indexOf('package.json') === 0) {
           zip.extractEntryTo(entry.entryName, '.wh-temp', true, true);
        }
      });

      fs.unlinkSync(zipFile);

      var packageJson = JSON.parse(fs.readFileSync('package.json'));
      var updatedPackageJson = JSON.parse(fs.readFileSync('.wh-temp/package.json'));

      _.assign(packageJson.dependencies, updatedPackageJson.dependencies);
      _.assign(packageJson.scripts, updatedPackageJson.scripts);

      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, "  "));

      var runNpmInstall = runNpmInstallFn( options )
      
      runNpmInstall(function() {
        runGruntInit(Object.assign( {}, options, config ), function() {
          fs.unlinkSync('.wh-temp/package.json');
          fs.rmdirSync('.wh-temp');
          step();
        });
      });
    });
  }
}

/**
 * Downloads repository from github and stores in temporary folder
 * @param  {Object}    config     Configuration information
 * @param  {Function}  callback   Called on completion
 */
function downloadUpdateRepo(config, callback) {

  console.log('Downloading repo...'.magenta);

  // Keep track if the request fails to prevent the continuation of the install
  var requestFailed = false;

  // TODO: have this hit different templating repos
  var repoRequest = request(config.generate);

  repoRequest
    .on('response', function (response) {
      // If we fail, set it as failing and remove zip file
      if (response.statusCode !== 200) {
        requestFailed = true;
        fs.unlinkSync('.generate-repo.zip');
        callback(true);
      }
    })
    .pipe(fs.createWriteStream('.generate-repo.zip'))
    .on('close', function () {
      if (requestFailed) return;

      callback(null, '.generate-repo.zip');
    });
}
