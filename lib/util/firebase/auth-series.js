var async = require( 'async' )
var getUserLoginInformationStep = require( '../get-user-login-information' ).step
var firebaseTokenAuthStep = require( './token-auth' ).step
var firebaseLoginUserStep = require( './login-user' ).step

module.exports = FirebaseAuthSeries;

/**
 * Authenticate a FirebaseInterface with the configFn.
 * configFn = () => {
 *   firebase,
 *   firebaseName,
 *   firebaseToken,
 *   firebaseAPIKey,
 *   webhookUsername?,
 *   webhookPassword?,
 *   platformName?,
 * }
 * @param {[type]} config [description]
 * @param {[type]} step   [description]
 */
function FirebaseAuthSeries ( configFn, step ) {

  var authSeries = [
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginUserStep.bind( null, configFn )
  ]

  async.series( authSeries, step )
}
