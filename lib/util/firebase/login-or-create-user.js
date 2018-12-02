var inquirer = require( 'inquirer' )
var loginUser = require( './login-user.js' )
var errors = require( './errors.js' )


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
  var webhookCreateUserProgrammatically = config.webhookCreateUserProgrammatically || false;

  var promptSecondPassword = function() {
    inquirer.prompt({
        type: 'password',
        name: 'password',
        message: 'Re-enter your password:',
      },
      function(answer) {
        if(answer.password !== '' && answer.password === userPassword) {
          firebase.createUser( { email: userEmail, password: userPassword } )
            .then( step )
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
          step( new Error( 'Passwords do not match.' ) )
        }
    });
  }

  loginUser( config, function ( error ) {
    if ( error ) {
      catchLoginError( error )
    }
    else if ( firebase.currentUser() ) {
      step()
    }
    else {
      step( new Error( 'Could not log in. Try again.' ) )
    }
  } )

  function catchLoginError ( error ) {
    if ( error.code === 'auth/wrong-password' ) {
      errors.authWrongPassword()
      step( error )
    }
    else if ( error.code === 'auth/user-not-found' && userPassword === '') {
      console.log('\n========================================================'.red);
      console.log('# Account not created                                  #'.red);
      console.log('========================================================'.red);
      console.log('# You need to set a real password, it can\'t be empty'.red);
      console.log('# ---------------------------------------------------- #'.red);
      step( error )
    }
    else if ( error.code === 'auth/user-not-found' && webhookCreateUserProgrammatically ) {
      firebase.createUser( { email: userEmail, password: userPassword } )
        .then( step )
        .catch( step )
    }
    else if ( error.code === 'auth/user-not-found' ) {
      console.log('To create an account, please type your password again.'.blue);
      promptSecondPassword()
    }
    else {
      step( error )
    }
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
