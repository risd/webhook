var inquirer = require( 'inquirer' )
var escapeEmail = require( '../escape-site.js' )

module.exports = firebaseLoginOrCreateUser;
module.exports.step = firebaseLoginOrCreateUserStep;

/**
 * Login or create user.
 * 
 * @param  {object} config
 * @param  {object} config.firebase        Initialized firebase interface
 * @param  {object} config.webhookUsername User email to login or create
 * @param  {object} config.webhookPassword User password
 * @param  {function} step                 Callback function, invoked upon completing sign in or user creation
 */
function firebaseLoginOrCreateUser(config, step) {

  var firebase = config.firebase;
  var userEmail = config.webhookUsername;
  var userPassword = config.webhookPassword;
  var escapedUserEmail = escapeEmail( userEmail.toLowerCase() )

  var promptSecondPassword = function() {
    inquirer.prompt({
        type: 'password',
        name: 'password',
        message: 'Re-enter your password:',
      },
      function(answer) {
        if(answer.password !== '' && answer.password === userPassword) {
          firebase.createUser( userEmail, userPassword )
            .then( handleCreateUser )
            .catch( catchCreateUserError )
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
          process.exit(1);
        }
    });
  }

  firebase.login( { email: userEmail, password: userPassword } )
    .then( handleLogin )
    .catch( catchLoginError )

  function handleLogin ( user ) {
    step()
  }

  function catchLoginError ( error ) {
    if ( error.code === 'auth/wrong-password' ) {
      console.log('\n========================================================'.red);
      console.log('# Password is incorrect                                #'.red);
      console.log('========================================================'.red);
      console.log('# Please doublecheck your records. You can change your password at:.'.red);
      console.log('# http://www.webhook.com/secret/password-reset/'.yellow);
      console.log('# ---------------------------------------------------- #'.red);
      process.exit( 1 )
    }
    else if ( error.code === 'auth/user-not-found' && config.webhookPassword === '') {
      console.log('\n========================================================'.red);
      console.log('# Account not created                                  #'.red);
      console.log('========================================================'.red);
      console.log('# You need to set a real password, it can\'t be empty'.red);
      console.log('# ---------------------------------------------------- #'.red);
    }
    else if ( error.code === 'auth/user-not-found' ) {
      console.log('To create an account, please type your password again.'.blue);
      promptSecondPassword()
    }
    else {
      console.log( error.message.red )
      process.exit( 1 )
    }
  }

  function handleCreateUser ( user ) {
    firebase.database().ref('users/' + escapedUserEmail + '/exists').set(true, function(err) {
      var data = {
        userid: userEmail.toLowerCase(),
        id: uniqueId()
      };

      firebase.database().ref('commands/verification/' + escapedUserEmail).set(data, function(err) {
        step();
      });
    });
  }

  function catchCreateUserError ( error ) {
    if ( error.code === 'auth/weak-password' ) {
      console.log('');
      console.log('========================================================'.red);
      console.log('# Your password is too weak.                           #'.red);
      console.log('========================================================'.red);
      console.log('# Try again with a strong password.                    #'.red);
      console.log('# ---------------------------------------------------- #'.red);
      process.exit( 1 )
    }
    else {
      return step( error )
    }
  }
}

function firebaseLoginOrCreateUserStep ( configFn, step ) {
  var config = configFn()
  if ( config.firebase.currentUser() ) return step();

  firebaseLoginOrCreateUser(config, step);
}