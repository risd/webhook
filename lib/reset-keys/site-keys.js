var uuid = require('node-uuid');

module.exports = ResetSiteKeys;

/**
 * @param {object}   opts
 * @param {Function} callback
 */
function ResetSiteKeys ( opts, callback ) {
	if ( ! ( this instanceof ResetSiteKeys ) ) return new ResetSiteKeys( opts, callback )
	if ( typeof opts === 'function' ) callback = opts
	if ( typeof opts !== 'object' ) opts = {}
	if ( typeof callback !== 'function' ) callback = function noop () {}

	var firebaseRef = opts.firebaseRef;

	// get site names
	// pair each site name with a new key uuid's
	// update the site keys
	// - management/sites/<siteName>/key/<key>
	// - buckets/<siteName>/key

	getSiteNames( function withSiteNames ( error, siteNames ) {
		if ( error ) return callback( error )

		var siteNamesKeys = siteNames.map( pairWithNewKey )

		updateKeys( siteNamesKeys, function onUpdated ( error ) {
			if ( error ) return callback( error )

			callback( null, siteNamesKeys )

		} )
	} )

	return {
		siteNames: getSiteNames,
		pairWithNewKey: pairWithNewKey,
		reset: updateKeys,
	}


	/**
	 * Get all site names from firebase.
	 * The names are the top level keys at `management/sites`.
	 * Expects a function to use as a callback.
	 * 
	 * @param  {Function} withSiteNames
	 * @return {undefined}
	 */
	function getSiteNames ( withSiteNames ) {
		try {
			var onSitesSnapshotError = withSiteNames;
			firebaseRef.child( 'management/sites' )
				.once( 'value', onSitesSnapshot, onSitesSnapshotError )
		} catch ( error ) {
			withSiteNames( error )
		}

		function onSitesSnapshot ( snapshot ) {
			try {
				var sitesData = sitesSnapshot.val()
				var siteNames = Object.keys( sitesData )
				withSiteNames( null, siteNames )
			} catch ( error ) {
				withSiteNames( error )
			}
		}
	}
	
	/**
	 * Expects a `siteName`, return an object with the `siteName` as a key
	 * and a fresh unique ID as the `key`.
	 * 
	 * @param  {string} siteName
	 * @return {object} siteNameKey
	 * @return {string} siteNameKey.siteName
	 * @return {string} siteNameKey.key
	 */
	function pairWithNewKey ( siteName ) {
		return {
			siteName: siteName,
			key: uuid.v4(),
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
	 * @param  {string}   siteNamesKeys[].key
	 * @param  {Function} onUpdated
	 * @return {undefined}
	 */
	function updateKeys ( siteNamesKeys, onUpdated ) {

		firebaseRef.transaction( updateInPlace, onCompletedTransaction );

		/**
		 * Expects `currentData` to be the root of a Webhook Firebase instance.
		 * Transforms the object in place, and returns the updated value.
		 * 
		 * @param  {object} currentData
		 * @return {object} currentData
		 */
		function updateInPlace ( currentData ) {
			try {
				var rootKeys = Object.keys( currentData  );

				var newKey = null;
				var currentKey = null;

				Object.keys( currentData.management.sites )
					.forEach( function ( siteName ) {

						var bucketSite = currentData.buckets[siteName];

						newKey = newKeyForSiteName( siteName );
						currentKey = currentKeyForBucketSite( bucketSite )

						if ( !newKey ) return console.log( 'Could not find new key for siteName: ' + siteName )
						if ( !currentKey ) return console.log( 'Could not find current key for siteName: ' + siteName )

						currentData.management.sites[ siteName ].key = newKey;
						currentData.buckets[ newKey ] = currentData.buckets[ currentKey ];
						delete currentData.buckets[ currentKey ]
						
					} )

				return currentData;

			} catch ( error ) {
				console.log( error )
				return;
			}
		}

		/**
		 * @param  {object}    error
		 * @param  {boolean}   commited
		 * @param  {object}    snapshot
		 * @return {undefined}
		 */
		function onCompletedTransaction ( error, committed, snapshot ) {
			if ( error ) return onUpdated( error )
			else if ( !committed ) return onUpdated( new Error('Transaction returned undefined.') )
			else return onUpdated( null, snapshot.val() )
		}

		/**
		 * Expects a `siteName` string.
		 * 
		 * @param  {string} siteName
		 * @return {string|null}
		 */
		function newKeyForSiteName( siteName ) {
			var key = null;
			try {
				var siteMatches = siteNamesKeys.filter( function ( siteNameKey ) {
					return siteNameKey.siteName === siteName;
				} )
				if ( siteMatches.length !== 1 ) return key;

				return siteMatches[0].key;

			} catch ( error ) {
				return key;
			}
		}

		/**
		 * Expects a `bucketSite` object. The object the represents
		 * a site within the root `bucket` node on Firebase.
		 * 
		 * @param  {object}
		 * @return {string|null}
		 */
		function currentKeyForBucketSite( bucketSite ) {
			var key = null;
			try {
				var bucketSiteKeys = Object.keys( bucketSite )
				if ( bucketSiteKeys.length !== 1 ) return key;
			} catch ( error ) {
				return key;
			}
		}
	}
	
}
