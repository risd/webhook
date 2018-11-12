var inquirer = require( 'inquirer' )
var escapeEmail = require( '../escape-site.js' )

module.exports.step = firebaseLoginUserStep;

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

  var firebase = config.firebase;
  var userEmail = config.webhookUsername;
  var userPassword = config.webhookPassword;
  var escapedUserEmail = escapeEmail( userEmail.toLowerCase() )

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
