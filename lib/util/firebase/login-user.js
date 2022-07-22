var escapeEmail = require( '../escape-site.js' )
var errors = require( './errors.js' )

module.exports = firebaseLoginUser;
module.exports.step = firebaseLoginUserStep;

function firebaseLoginUser ( config, step ) {

  var firebase = config.firebase;
  var userEmail = config.webhookUsername;
  var userPassword = config.webhookPassword;

  firebase.login( { email: userEmail, password: userPassword } )
      .then( handleLoggedIn )
      .catch( step )

  function handleLoggedIn ( user ) {
    step()
  }
}

/**
 * Login user.
 * 
 * @param  {Function} configFn             Function that returns the current `config` object.
 * @param  {object} config.firebase        Initialized firebase interface
 * @param  {object} config.webhookUsername User email to login or create
 * @param  {object} config.webhookPassword User password
 * @param  {function} step                 Callback function, invoked upon completing sign in or user creation
 */
function firebaseLoginUserStep( configFn, step ) {
  var config = configFn()

  firebaseLoginUser( config, handleLogin )

  function handleLogin ( error ) {
    if ( error ) {
      logError( error )
      step( error )
    }
    else {
      step()
    }
  }

  function logError ( error ) {
    if ( error.code === 'auth/wrong-password' ) {
      errors.authWrongPassword()
    }
    else if ( error.code === 'auth/user-not-found' ) {
      console.log('User not found. Use the `init` command to create an account.'.blue);
    }
    else {
      console.log( error.message.red )
    }
  }
}
