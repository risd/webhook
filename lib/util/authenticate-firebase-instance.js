var User = require('./user.js');

module.exports = authenticateFirebaseInstance;

/**
 * authenticateFirebaseInstance
 * Common task of authenticating a firebase reference,
 * and updating the configwith its new values
 *
 * Returns an asynchronous task to be run in series
 * if no callback is provided
 * 
 * @param  {object} options
 * @param  {object} options.config    The configuration to update
 * @param  {object} options.firebase  The firebase to authenticate
 * @param  {Function} callback        Optionally define the async hook with options
 * @return {Function} task
 */
function authenticateFirebaseInstance ( options, callback ) {
  
  var config = options.config;
  var firebase = options.firebase;

  if ( typeof callback === 'function' ) return task( callback );
  else return task;
  
  function task ( step ) {

    if( config.firebaseToken ) {
      authFirebase( step )
    } else {
      var user = User( firebase )
      promptForToken( step )
    }

    function promptForToken ( substep ) {
      user.getUserLoginInformation( 'risd.systems', function ( error, credentials ) {
        if ( error ) return substep( error )

        config.webhookUsername = credentials.webhookUsername;
        config.webhookPassword = credentials.webhookPassword;

        user.firebaseLoginOrCreateUser( config, function ( error, updatedConfig ) {
          if ( error ) return substep( error )
          Object.assign( config, updatedConfig )
          // Firebase instance is now authenticated,
          // we can now use it to interact with deploys data
          authFirebase( substep )
        } )
      })
    }

    function authFirebase ( substep ) {
      firebase.auth( config.firebaseToken, substep )
    }
  }

}
