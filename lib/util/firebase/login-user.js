var tokenAuth = require( './token-auth' ).step
var escapeEmail = require( '../escape-site.js' )

module.exports = firebaseLoginUser;
module.exports.step = firebaseLoginUserStep;

function firebaseLoginUser ( config, step ) {

  var firebase = config.firebase;
  var firebaseToken = config.firebaseToken;
  var userEmail = config.webhookUsername;
  var userPassword = config.webhookPassword; 

  firebaseLoginUser( config, function ( error ) {
    if ( error ) return catchLoginError( error )
    step()
  } )

  if ( firebaseToken ) {
    tryTokenAuth()
  }
  else {
    tryEmailPasswordAuth()
  }

  function tryTokenAuth () {
    tokenAuth( config, tokenAuthHandler )

    function tokenAuthHandler () {
      if ( firebase.currentUser() ) return handleLogin()
      tryEmailPasswordAuth()
    }
  }

  function tryEmailPasswordAuth () {
    firebase.login( { email: userEmail, password: userPassword } )
      .then( handleLogin )
      .catch( catchLoginError )
  }

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
    else if ( error.code === 'auth/user-not-found' ) {
      console.log('User not found. Use the `init` command to create an account.'.blue);
      step( error )
      process.exit( 1 )
    }
    else {
      console.log( error.message.red )
      process.exit( 1 )
    }
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
  firebaseLoginUser( config, step )
}
