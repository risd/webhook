module.exports.ensureSiteNameAndKeyExist = ensureSiteNameAndKeyExist;
module.exports.authenticateFirebaseInstance = authenticateFirebaseInstance;

/**
 * ensureSiteNameAndKeyExist
 * A common step of ensuring the defined `config` variable
 * includes the `sitename` and `sitekey` per the .firebase.conf
 *
 * Returns an asynchronous task to be run in series
 * if no callback is provided
 * 
 * @param  {object}   config
 * @param  {Function} callback?  Optionally define the async hook with options
 * @return {Function} task       The task to run
 */
function ensureSiteNameAndKeyExist ( config, callback ) {
  var fs = require('fs');

  if ( typeof callback === 'function' ) return task( callback );
  else return task;

  function task ( step ) {
    if ( config.sitename && config.sitekey ) return step()

    fs.readFile( '.firebase.conf', function ( error, firebaseConf ) {
      if ( error ) return step( error )
      
      var json = JSON.parse( firebaseConf.toString() )
      
      config.sitename = json.siteName;
      config.sitekey = json.secretKey;
      
      step();
    } )

  }
}

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
  var User = require('./user.js');
  
  var config = options.config;
  var firebase = options.firebase;

  if ( typeof callback === 'function' ) return task( callback );
  else return task;
  
  function task ( step ) {

    if( config.firebaseToken ) {
      firebase.auth( config.firebaseToken, function ( error ) {
        // token is expired
        if ( error ) promptForToken( step )
        // Firebase instance is now authenticated,
        // we can now use it to interact with deploys data
        else step();
      } )

    } else {
      var user = User( firebase )
      promptForToken( step )
    }

    function promptForToken ( substep ) {
      user.getUserLoginInformation( 'risd.systems', function ( error, credentials ) {
        if ( error ) return callback( error )

        config.webhookUsername = credentials.webhookUsername;
        config.webhookPassword = credentials.webhookPassword;
        
        user.firebaseLoginOrCreateUser( config, function ( error, updatedConfig ) {
          if ( error ) return callback( error )
          config = objectAssign( config, updatedConfig )
          // Firebase instance is now authenticated,
          // we can now use it to interact with deploys data
          substep()
        } )
      })
    }
  }

}
