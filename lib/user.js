var inquirer = require('inquirer');
var firebaseLogin = require('./firebase-login');
var firebase = require('firebase');


module.exports = function User ( firebaseRoot ) {
  if (!(this instanceof User)) return new User( firebaseRoot );

  return {
  	getUserLoginInformation: wrapFunctionInScope( getUserLoginInformation ),
  	firebaseLoginOrCreateUser: wrapFunctionInScope( firebaseLoginOrCreateUser ),
  }

  function wrapFunctionInScope ( fn ) {
  	return fn
  }
}

module.exports.lib = {
  getUserLoginInformation: getUserLoginInformation,
  firebaseLoginOrCreateUser: firebaseLoginOrCreateUser,
}

function getUserLoginInformation( service, callback ) {
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
    	var credentials = { webhookUsername: username, webhookPassword: password };
      callback( null, credentials )
    });
  });
}

function firebaseLoginOrCreateUser( config, callback ) {

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
              callback( err );
            }

            firebaseRoot.auth(user.token, function(err, success) {
              firebaseRoot.child('users/' + config.webhookUsername.replace(/\./g, ',1') + '/exists').set(true, function(err) {
                config.firebaseToken = user.token;
                var data = {
                  userid: user.email.toLowerCase(),
                  id: uniqueId()
                };

                firebaseRoot.child('commands/verification/' + user.email.toLowerCase().replace(/\./g, ',1')).set(data, function(err) {
                  callback( null, config );
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
          callback(new Error('Passwords do not match.'));
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
      callback(err)
    } else {
      config.firebaseToken = user.token;
      callback( null, config );
    }
  });
}

function firebaseRetrieveToken( config, callback ) {
  firebaseRoot.auth( config.firebaseToken, function(error, auth) {
    if( error ) return callback( error )
    
    var data = {};
    data[config.webhookEscapedUsername] = config.webhookUsername;

    firebaseRoot.child('sites/'+ config.siteName).once('value', function(data) {
      data = data.val();
      if(data.key) {
        config.siteToken = data.key
      }

      callback( null, config );

    }, function(err) {
      if(err.code === 'PERMISSION_DENIED') // Either this doesn't exist yet or it does and we dont have access
      {
      	err.message = 'This site does not exist or you do not have permissions';
        callback( err )
      }
    });

  });
}