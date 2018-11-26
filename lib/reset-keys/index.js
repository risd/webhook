var async = require('async');

var Firebase = require( '../util/firebase/index' )

var resetUserPasswords = require( './user-passwords.js' )
var resetSiteKeys = require( './site-keys.js' )

var functor = require( '../util/functor' )
var exitCallback = require( '../util/exit-callback' )

module.exports = ResetKeys;

function ResetKeys ( options, callback ) {
	if ( ! ( this instanceof ResetKeys ) ) return new ResetKeys( options, callback )
	if ( typeof callback !== 'function' ) callback = exitCallback

  var firebase = Firebase( options )

	var config = {
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebaseAdminCert: options.firebaseAdminCert,
    firebaseAuthContinuationUrlFn: options.firebaseAuthContinuationUrlFn,
    firebase: firebase,
		resetSiteKeys: options.resetSiteKeys || true,
		resetUserPasswords: options.resetUserPasswords || true,
	}

  var configFn = functor( config )

	var steps = []
	if ( config.resetSiteKeys ) steps = steps.concat( [ resetSiteKeysStep ] )
	if ( config.resetUserPasswords ) steps = steps.concat( [ resetUserPasswordsStep ] )

	return async.series( steps, callback )

	function resetSiteKeysStep ( step ) {
		resetSiteKeys( { firebase: firebase }, function ( error, siteNamesKeys ) {
			if ( error ) return callback( error )
			step()
		} )
	}

	function resetUserPasswordsStep ( step ){
		resetUserPasswords( { firebase: firebase }, function ( error ) {
			if ( error ) return callback( error )
			step()
		} )
	}

}
