var async = require('async');
var firebaseLogin = require( '../firebase-login.js' )
var resetUserPasswords = require( './user-passwords.js' )
var resetSiteKeys = require( './site-keys.js' )

function exit ( error ) {
  return error
    ? (function () { console.log( error.message.red ); process.exit(1) }())
    : process.exit(0);
}

module.exports = ResetKeys;

function ResetKeys ( opts, callback ) {
	if ( ! ( this instanceof ResetKeys ) ) return new ResetKeys( opts, callback )
	if ( typeof opts === 'function' ) callback = opts
	if ( typeof opts !== 'object' ) opts = {}
	if ( typeof callback !== 'function' ) callback = exit

	var config = {
		firebaseName: opts.firebaseName || '',
		firebaseToken: opts.firebaseToken || '',
		resetSiteKeys: opts.resetSiteKeys || true,
		resetUserPasswords: opts.resetUserPasswords || true,
	}

	var firebaseRoot = null;
	firebaseLogin.setFirebaseName = config.firebaseName;

	var steps = [ loginStep ]
	if ( config.resetSiteKeys ) steps = steps.concat( [ resetSiteKeysStep ] )
	if ( config.resetUserPasswords ) steps = steps.concat( [ resetUserPasswordsStep ] )

	return async.series( steps, callback )

	function loginStep ( step ) {
		firebaseLogin.tokenAuth( config.firebaseToken, function ( error, firebaseRef ) {
			if ( error ) return callback( error )
			firebaseRoot = firebaseRef;
			step();
		} )
	}

	function resetSiteKeysStep ( step ) {
		resetSiteKeys( { firebaseRef: firebaseRoot }, function ( error, siteNamesKeys ) {
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
