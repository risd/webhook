'use strict';

var fs    = require('fs');
var Zip   = require('adm-zip');
var async = require('async');

require('colors');

var request  = require('request');
var winSpawn = require('win-spawn');
var wrench   = require('wrench');
var inquirer = require('inquirer');
var firebaseLogin = require('./firebase-login');
console.warn = function() {};
var firebase = require('firebase');
var firebaseRoot = null;

function uniqueId() {
  return Date.now() + 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

var unescapeSite = function(site) {
  return site.replace(/,1/g, '.');
}

var escapeSite = function ( site ) {
  return site.replace( /\./g, ',1' )
}

var isValidSite = function(sitename) {
  return /^[\d\w\-_\.,]+$/.test(sitename);
}

function exit (error) {
  return typeof error === 'undefined'
    ? process.exit(0)
    : process.exit(1);
}

module.exports = function (options, callback) {
  if (typeof callback !== 'function') callback = exit;

  // Set of basic configuration for this (Defaults)
  var config = {
    generate: options.generate || 'http://dump.webhook.com/static/generate-repo.zip',
    siteName:  escapeSite( options.siteName ),
    siteToken: null,
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: '',
    server: options.server,
    firebaseName: options.firebaseName || 'webhook',
    firebaseToken: options.firebaseToken || null,
    imgix_host: options.imgix_host || null,
    imgix_secret: options.imgix_secret || null,
  };

  if(options.node || options.npm) {
    winSpawn = require('child_process').spawn;
  }

  firebaseLogin.setFirebaseName(config.firebaseName);

  firebaseRoot = new firebase('https://' + config.firebaseName + '.firebaseio.com/management');

  // Directory where git repository is unzipped
  var tmpFolder = '.wh-generate';

  printLogo();

  async.series([

    function validateSiteName (step) {
      if(!isValidSite(config.siteName)) {
        var error_message = 'Invalid sitename. Can only contain letters, numbers, and dashes.';
        console.log(error_message.red);
        return callback(new Error(error_message))
      }

      step();
    },

    function confirmDirectoryOverwrite (step) {
      if(fs.existsSync(config.siteName) && !options.force) {
        inquirer.prompt({
          type: 'confirm',
          name: 'confirm',
          message: 'There is already a directory named ' + config.siteName + '. This will overwrite that directory. Continue?'
        }, function(answer) {
          if(answer.confirm) {
            step();
          } else {
            return callback();
          }
        });
      } else {
        step();
      }
    },

    function attemptFirebaseLogin (step) {

      if(config.firebaseToken) {
        config.webhookEscapedUsername = config.webhookUsername.replace(/\./g, ',1');
        step();
        return;
      }

      getUserLoginInformation('Webhook', function(username, password) {
        config.webhookUsername = username.toLowerCase();
        config.webhookEscapedUsername = username.toLowerCase().replace(/\./g, ',1');
        config.webhookPassword = password;
        step();
      });
    },

    function ensureUser (step) {

      if(config.firebaseToken) {
        step();
        return;
      }

      firebaseLoginOrCreateUser(config, step, callback);
    },

    function reserveSite (step) {
      firebaseReserverSite(config, step, callback);
    },

    function createSite (step) {
      firebaseCreateSite(config, step, callback);
    },

    function downloadGenerateRepo (step) {
      // Download the repo to temp folder
      downloadRepo(config, tmpFolder, function (error, gitFolder) {
        if (error) {
          var error_message = 'No repository found at ';
          var error_detail = config.generate;
          console.log(error_message.red + error_detail.blue);
          error_message += error_detail;
          return callback(error_message);
        }

        step();

      });
    },

    function installProject (step) {
      console.log('Installing project to folder...'.magenta);
      // Generates actual project
      generateProject(config, step);
    },

  ], function cleanUpOnComplete () {

    // Cleanup temporary folder
    wrench.rmdirSyncRecursive(tmpFolder);

    console.log('Running initialization...'.magenta);

    // Run first time initialization

    var dirName = config.siteName;

    if(config.firebase !== 'webhook') {
      dirName = unescapeSite(dirName);
    }

    var runNpm = null;

    if(options.cache) {
      runNpm = function(cb) {
        runInDir(options.npm || 'npm', dirName, ['config', 'get', 'cache'], true, function(diroutput) {
          var oldCacheDir = diroutput.trim();
          runInDir(options.npm || 'npm', dirName, ['config', 'set', 'cache', options.cache], function() {
            runInDir(options.npm || 'npm', dirName, ['install'], function() {
              runInDir(options.npm || 'npm', dirName, ['config', 'set', 'cache', oldCacheDir], function() {
                cb();
              });
            });
          });
        });
      };
    } else {
      runNpm = function(cb) {
        runInDir(options.npm || 'npm', dirName, ['install'], function() {
          cb();
        });
      }
    }

    runNpm(function() {
      var params = ['init', '--copycms=true', '--sitename=' + config.siteName, '--secretkey=' + config.siteToken];

      if(options.firebase) {
        params.push('--firebase=' + config.firebaseName);
      }

      if(options.server) {
        params.push('--server=' + options.server);
      }

      if (options.embedly) {
        params.push('--embedly=' + options.embedly);
      }

      if (options.imgix_host) {
        params.push('--imgix_host=' + options.imgix_host);
      }

      if (options.imgix_secret) {
        params.push('--imgix_secret=' + options.imgix_secret);
      }

      if (options.generate) {
        params.push('--generator_url=' + options.generate);
      }

      if(options.node && options.grunt) {
        params.unshift(options.grunt);
      }

      runInDir(options.node || 'grunt', dirName, params, function() {

        console.log('\n========================================================'.blue);
        console.log('# We just created a new site on your computer.         #'.blue);
        console.log('========================================================'.blue);
        console.log('#'.blue + ' Next step: Type '+ 'cd '.cyan + dirName.cyan + ' and then' + ' wh serve'.cyan + ''.blue)
        console.log('# ---------------------------------------------------- #'.blue)

        callback(undefined, config);
      });
    });

  });
};

/**
 * Downloads repository from github and stores in temporary folder
 * @param  {Object}    config     Configuration information
 * @param  {String}    tmpFolder  Temporary foler to save unzipped item into
 * @param  {Function}  callback   Called on completion
 */
function downloadRepo(config, tmpFolder, callback) {

  console.log('Downloading repo...'.magenta);

  // Keep track if the request fails to prevent the continuation of the install
  var requestFailed = false;

  var repoRequest = request(config.generate);

  repoRequest
    .on('response', function (response) {
      // If we fail, set it as failing and remove zip file
      if (response.statusCode !== 200) {
        requestFailed = true;
        fs.unlinkSync('repo.zip');
        callback(true);
      }
    })
    .pipe(fs.createWriteStream('repo.zip'))
    .on('close', function () {
      if (requestFailed) return;

      console.log('Extracting Files...'.magenta);
      // Unzip into temporary file
      var zip = new Zip('repo.zip');
      zip.extractAllTo(tmpFolder);
      fs.unlinkSync('repo.zip');
      callback(null, tmpFolder + '/' + fs.readdirSync(tmpFolder)[0]);
    });
}

/**
 * Generates project from copied repository
 * @param  {Object}    config     Configuration information
 * @param  {String}    gitFolder  Temporary foler to save unzipped item into
 * @param  {Function}  callback   Called on completion
 */
function generateProject(config, callback) {
  var dirName = config.siteName;

  if(config.firebase !== 'webhook') {
    dirName = unescapeSite(dirName);
  }

  wrench.copyDirSyncRecursive('.wh-generate/', process.cwd() + '/' + dirName, {
      forceDelete: true
  });

  callback();
}

function printLogo() {
  var logo = '';
  logo = logo + '┬ ┬┌─┐┌┐ ┬ ┬┌─┐┌─┐┬┌─\n'
  logo = logo + '│││├┤ ├┴┐├─┤│ ││ │├┴┐\n'
  logo = logo + '└┴┘└─┘└─┘┴ ┴└─┘└─┘┴ ┴\n'
  logo = logo + 'Documentation at http://www.webhook.com/docs/\n'

  console.log('\nHowdy partner, welcome to...\n'.blue);
  console.log(logo)
  console.log('To begin log in or create a Webhook account below.\n'.green);
}

function firebaseLoginOrCreateUser(config, step, errorExit) {

  var promptSecondPassword = function() {
    inquirer.prompt({
        type: 'password',
        name: 'password',
        message: 'Re-enter your password:',
      }, function(answer) {
        if(answer.password !== '' && answer.password === config.webhookPassword)
        {
          firebaseLogin.createUser(config.webhookUsername, config.webhookPassword, function(err, user) {
            if(err) {
              console.log(err.message);
              errorExit(err);
            }

            firebaseRoot.auth(user.token, function(err, success) {
              firebaseRoot.child('users/' + config.webhookUsername.replace(/\./g, ',1') + '/exists').set(true, function(err) {
                config.firebaseToken = user.token;
                var data = {
                  userid: user.email.toLowerCase(),
                  id: uniqueId()
                };

                firebaseRoot.child('commands/verification/' + user.email.toLowerCase().replace(/\./g, ',1')).set(data, function(err) {
                  step();
                });
              });
            });

          });
        } else if (answer.password.trim() === '') {
          console.log('\n========================================================'.red);
          console.log('# No second password entered, please re-enter          #'.red);
          console.log('========================================================'.red);
          promptSecondPassword();
        } else {
          console.log('\n========================================================'.red);
          console.log('# Your passwords didn\'t match                         #'.red);
          console.log('========================================================'.red);
          console.log('# Happens to everyone. Why don\'t you give it another try.'.red);
          console.log('# ---------------------------------------------------- #'.red);
          errorExit(new Error('Passwords do not match.'));
        }
    });
  }

  firebaseLogin.login(config.webhookUsername, config.webhookPassword, function(err, user) {
    if(err && err.code === 'INVALID_USER')
    {
      if(config.webhookPassword === '') {
        console.log('\n========================================================'.red);
        console.log('# Account not created                                  #'.red);
        console.log('========================================================'.red);
        console.log('# You need to set a real password, it can\'t be empty'.red);
        console.log('# ---------------------------------------------------- #'.red);
      } else {
        console.log('To create an account, please type your password again.'.blue);
        promptSecondPassword();
      }
    } else if (err) {
      if(err.code && err.code === 'INVALID_PASSWORD') {
        console.log('\n========================================================'.red);
        console.log('# Password is incorrect                                #'.red);
        console.log('========================================================'.red);
        console.log('# Please doublecheck your records. You can change your password at:.'.red);
        console.log('# http://www.webhook.com/secret/password-reset/'.yellow);
        console.log('# ---------------------------------------------------- #'.red);
      } else {
        console.log(err.message.red);
      }

      errorExit(err)
    } else {
      config.firebaseToken = user.token;
      step();
    }
  });
};

function firebaseReserverSite(config, step, errorExit) {
  firebaseRoot.auth(config.firebaseToken, function(error, auth) {
    if(error) {
      errorExit(error);
    }

    var data = {};
    data[config.webhookEscapedUsername] = config.webhookUsername;

    firebaseRoot.child('sites/'+ config.siteName).once('value', function(data) {
      data = data.val();
      if(data.key) {
        config.siteToken = data.key
      }

      if(!data.owners[config.webhookEscapedUsername]) {
        console.log('\n========================================================'.red);
        console.log('# The site '.red + config.siteName + ' is already taken'.red);
        console.log('========================================================'.red);
        console.log('# This name has already been taken by another user.'.red);
        console.log('# Please try a different one. Site names have nothing'.red);
        console.log('# to do with the domain you\'ll eventually use.'.red);
        console.log('# ---------------------------------------------------- #'.red);
        errorExit(new Error('Site already exists'));
      }

      step();
    }, function(err) {
      if(err.code === 'PERMISSION_DENIED') // Either this doesn't exist yet or it does and we dont have access
      {
        firebaseRoot.child('sites/'+ config.siteName + '/owners').set(data, function(err, data) {
          if(err)
          {
            console.log('\n========================================================'.red);
            console.log('# The site '.red + config.siteName + ' is already taken'.red);
            console.log('========================================================'.red);
            console.log('# This name has already been taken by another user.'.red);
            console.log('# Please try a different one. Site names have nothing'.red);
            console.log('# to do with the domain you\'ll eventually use.'.red);
            console.log('# ---------------------------------------------------- #'.red);
            errorExit(new Error('Site already exists'));
          }

          step();
        });
      } else {
        errorExit(err)
      }
    });
  });
};

function firebaseCreateSite(config, step, errorExit) {
  if(config.siteToken)
  {
    console.log('Site information downloaded from webhook, creating project directory'.cyan);
    step();
  } else {
    console.log('Signaling webhook to create site'.green);
    var data = {
      userid: config.webhookUsername,
      sitename: config.siteName,
      id: uniqueId(),
    }

    firebaseRoot.child('sites/' + config.siteName + '/error/').set(false, function(err, something) {
      firebaseRoot.child('commands/create/' + config.siteName).set(data, function(err, data) {
        if(err) {
          console.log(err.message.red);
          errorExit(err);
        }

        var listener = firebaseRoot.child('sites/' + config.siteName).on('value', function(data) {
          data = data.val();

          if(data.key)
          {
            config.siteToken = data.key;
            firebaseRoot.child('sites/' + config.siteName).off('value', listener);
            step();
          }

          if(data.error) {
            var error_message = 'Unable to create ';
            var error_detail = config.siteName;
            var error_explained = '. Please make sure your site name is valid.';
            console.log(error_message.red + error_detail.red + error_explained.red);
            error_message += error_detail + error_explained;
            errorExit(error_message);
          }

        }, function(error) {
          console.log(error.message.red);
          errorExit(error);
        });
      });
    });
  }
}

function getUserLoginInformation(service, callback) {
  var username = '';
  var password = '';

  inquirer.prompt({
    type: 'input',
    name: 'username',
    message: 'Enter your ' + service + ' email:',
  }, function (answer) {
    username = answer.username;

    function promptPassword(cb) {
      inquirer.prompt({
        type: 'password',
        name: 'password',
        message: 'Enter your ' + service +' password:',
      }, function (answer) {
        password = answer.password;
        if(password.trim() === '') {
          console.log('\n========================================================'.red);
          console.log('# No password entered, please re-enter                 #'.red);
          console.log('========================================================'.red);
          promptPassword(cb);
        } else {
          cb(password);
        }
      }); 
    }

    promptPassword(function(password) {
      callback(username, password)
    });
  });
}

function runInDir(command, cwd, args, pipe, callback) {

  if(typeof pipe === 'function') {
    callback = pipe;
    pipe = false;
  }
  var command = winSpawn(command, args, {
    stdio: [process.stdin, pipe ? 'pipe' : process.stdout, process.stderr],
    cwd: cwd
  });

  var output = '';

  if(pipe) {
    command.stdout.on('data', function (data) {
      output += data;
    });
  }

  command.on('error', function() {
    console.log('There was an error trying to run this command'.red);
    console.log('Please make sure you have node, npm, and grunt installed'.red);
  });

  command.on('close', function() {
    callback(output);
  });
};
