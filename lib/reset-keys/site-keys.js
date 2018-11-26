var uuid = require('node-uuid');

module.exports = ResetSiteKeys;

/**
 * @param {object}   opts
 * @param {Function} callback
 */
function ResetSiteKeys ( opts, callback ) {
	if ( ! ( this instanceof ResetSiteKeys ) ) return new ResetSiteKeys( opts, callback )

	var firebase = opts.firebase;

	// get site names
	// pair each site name with a new key uuid's
	// update the site keys
	// - management/sites/<siteName>/key/<key>
	// - buckets/<siteName>/key

	getSiteNamesKeys( function withSiteNames ( error, siteNamesKeys ) {
		if ( error ) return callback( error )

		var siteNamesKeysForUpdate = siteNamesKeys.map( pairWithNewKey )

		updateKeys( siteNamesKeysForUpdate, function onUpdated ( error, siteNamesKeysUpdated ) {
			if ( error ) return callback( error, siteNamesKeysUpdated )

			callback( null, siteNamesKeysUpdated )

		} )
	} )


	/**
	 * Get all site names & keys from firebase.
	 * The names are the top level keys at `management/sites`,
	 * keys are stored at `management/sites/{site-name}/key`.
	 * 
	 * Expects a function to use as a callback.
	 * 
	 * @param  {Function} withSiteNamesKeys
	 * @return {undefined}
	 */
	function getSiteNamesKeys ( withSiteNamesKeys ) {
		try {
			var onSitesSnapshotError = withSiteNamesKeys;
			firebase.allSites()
				.then( onSitesSnapshot )
				.catch( onSitesSnapshotError )
		} catch ( error ) {
			onSitesSnapshotError( error )
		}

		function onSitesSnapshot ( snapshot ) {
			console.log( 'sites-snapshot' )
			try {
				var sitesData = sitesSnapshot.val()
				var siteNamesKeys = Object.keys( sitesData ).map( function ( siteName ) {
					return {
						siteName: siteName,
						siteKey: sitesData[ siteName ].key,
					}
				} )
				withSiteNamesKeys( null, siteNamesKeys )
			} catch ( error ) {
				withSiteNamesKeys( error )
			}
		}
	}
	
	/**
	 * Expects a `siteName`, return an object with the `siteName` as a key
	 * and a fresh unique ID as the `key`.
	 * 
	 * @param  {string} siteData
	 * @return {object} siteData
	 * @return {string} siteData.siteName
	 * @return {string} siteData.key
	 */
	function pairWithNewKey ( siteData ) {
		return {
			siteName: siteData.siteName,
			currentSiteKey: siteData.siteKey,
			newSiteKey: uuid.v4(),
		}
	}

	function currentSiteOptions ( siteData ) {
		return {
			siteName: siteNamesKeys.siteName,
			siteKey: siteNamesKeys.currentSiteKey,
		}
	}

	function newSiteOptions ( siteData ) {
		return {
			siteName: siteNamesKeys.siteName,
			siteKey: siteNamesKeys.newSiteKey,	
		}
	}

	/**
	 * Expects `siteNamesKeys` & `onUpdated` callback.
	 * For each `siteName` & key pair update the key values at
	 * - management/sites/<siteName>/key/<key>
	 * - buckets/<siteName>/<key>
	 * 
	 * @param  {object}   siteNamesKeys[]
	 * @param  {string}   siteNamesKeys[].siteName
	 * @param  {string}   siteNamesKeys[].currentSiteKey
	 * @param  {string}   siteNamesKeys[].newSiteKey
	 * @param  {Function} onUpdated
	 * @return {undefined}
	 */
	function updateKeys ( siteNamesKeys, onUpdated ) {

		var updates = siteNamesKeys.map( toUpdateKeyValueTask )

		async.parallelLimit( updates, 10, onUpdated )

		function toUpdateKeyValueTask ( siteNameKeys ) {
			return function updateKeyValueTask ( step ) {
				var series = [
					migrateData.bind( null, siteNameKeys ),
					deleteData.bind( null, siteNameKeys ),
					setKey.bind( null, siteNameKeys ),
				]
				async.series( series, step )
			}
		}

		function migrateData ( siteNameKeys, step ) {
			var existingOptions = currentSiteOptions( siteNameKeys )
			var migrateOptions = newSiteOptions( siteNameKeys )

			firebase.siteDevData( existingOptions )
				.then( migrateSiteData )
				.then( updateConfig )
				.catch( step )

			function migrateSiteData ( devDataSnapshot ) {
				var devData = devDataSnapshot.val()
				return firebase.siteDevData( migrateOptions, devData )
			}

			function updateConfig () {
				siteNameKeys.migratedData = true
				step()
			}
		}

		function deleteData ( siteNameKeys, step ) {
			var options = currentSiteOptions( siteNameKeys )
			firebase.removeSiteKeyData( options )
				.then( updateConfig )
				.catch( step )

			function updateConfig () {
				siteNameKeys.removedOldData = true;
				step()
			}
		}

		function setKey ( siteNameKeys, step ) {
			var options = { siteName: siteNameKeys.siteName }
			var setKeyValue = siteNameKeys.newSiteKey
			firebase.siteKey( options, setKeyValue )
				.then( updateConfig )
				.catch( step )

			function updateConfig () {
				siteNameKeys.newSiteKeySet = true
				step()	
			}
		}
	}
	
}
