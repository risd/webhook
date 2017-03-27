module.exports = ResetUserPasswords;

function ResetUserPasswords ( opts, callback ) {
	if ( ! ( this instanceof ResetUserPasswords ) ) return new ResetUserPasswords( opts, callback )
	if ( typeof opts === 'function' ) callback = opts
	if ( typeof opts !== 'object' ) opts = {}
	if ( typeof callback !== 'function' ) callback = function noop () {}

	var firebaseRef = opts.firebaseRef;

	getFirebaseUsers( function withUsers ( error, users ) {
		if ( error ) return callback( error )

		resetPasswords( users, function onComplete ( error ) {

			callback( error )

		} )
	} )

	function getFirebaseUsers ( usersHandler ) {
		try {
			firebaseRef.child( 'management/users' ).once( 'value', returnUsers )
		} catch ( error ) {
			usersHandler( error )
		}

		function returnUsers ( usersSnapshot ) {
			try {
				var usersData = usersSnapshot.val();
				var users = Object.keys( usersData );
				usersHandler( null, users )
			} catch ( error ) {
				usersHandler( error )
			}
		}
	}

	function resetPasswords ( users, onComplete ) {
		var ERROR_INVALID_USER = 'INVALID_USER';
		var retryTask = taskRetryManager();

		var resetPasswordTasks = users.map( resetPasswordTaskFromUser )

		async.parallelLimit( resetPasswordTasks, onComplete )

		function resetPasswordTaskFromUser ( user ) {

			var createTaskFrom = function ( user, onTaskComplete, onTaskError ) {
				firebaseRef.resetPassword( { email: user }, function ( error ) {
					var taskCallback = onTaskComplete;
					if ( error ) {
						switch ( error.code ) {
							case ERROR_INVALID_USER:
								console.log( user + ' does not exist.' );
								break;
							default:
								taskCallback = onTaskError;
								break;
						}
					}
					return taskCallback()
				} )
			}

			function onTaskError () {
				retryTask( function () {
					createTaskFrom( user, onTaskComplete, onTaskError )
				} )
			}

			function task ( onTaskComplete ) {
				return createTaskFrom( user, onTaskComplete, onTaskError )
			}

			return task;
		}

		function taskRetryManager () {
			var taskRetryAttempts = 0;

			var retryTask = function ( task ) {
				taskRetryAttempts += 1;
				var timeout = backoffTime( taskRetryAttempts );
				setTimeout( function retry () {
					task()
				}, timeout )
			}

			return retryTask;

			function backoffTime (attempt) {
			  var backoff = Math.pow(2, attempt);
			  var maxBackoffTime = 32000;
			  var randomOffset = Math.random() * 10;
			  return Math.min(backoff, maxBackoffTime) + randomOffset;
			}
		}
	}
}
