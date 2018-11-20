var async = require('async');

var Firebase = require( '../util/firebase/index' )
var firebaseTokenAuthStep = require( '../util/firebase/token-auth' ).step

var resetUserPasswords = require( './user-passwords.js' )
var resetSiteKeys = require( './site-keys.js' )

var functor = require( '../util/functor' )
var exitCallback = require( '../util/exit-callback' )

module.exports = ResetKeys;

function ResetKeys ( opts, callback ) {
	if ( ! ( this instanceof ResetKeys ) ) return new ResetKeys( opts, callback )
	if ( typeof callback !== 'function' ) callback = exitCallback

  var firebase = Firebase( options )

	var config = {
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
		resetSiteKeys: opts.resetSiteKeys || true,
		resetUserPasswords: opts.resetUserPasswords || true,
	}

  var configFn = functor( config )

	var steps = [ firebaseTokenAuthStep.bind( null, configFn ), ]
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
		resetUserPasswords( { firebaseRef: firebaseRoot }, function ( error ) {
			if ( error ) return callback( error )
			step()
		} )
	}

}
