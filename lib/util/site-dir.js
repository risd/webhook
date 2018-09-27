var gcloudSiteDir = require( 'gcloud-site-dir' )
var purge = require( './cdn-purge' )
var async = require( 'async' )

module.exports = SiteDirectory;

/**
 * Upload a directory to google cloud storage, and issue
 * purge requests against each file uploaded.
 *  
 * @param {object} options
 * @param {object} options.keyFile         Google Cloud Storage credentials
 * @param {string} options.siteName        Name of the bucket to upload to
 * @param {string} options.directory       The directory to upload
 * @param {string} options.directoryPrefix The path on Google Cloud Storage to upload the directory to
 * @param {boolean} options.debug
 * @param {Function} complete
 */
function SiteDirectory ( options, complete ) {
  if ( ! options ) throw new Error( 'Site Directory requires an `options` object.' )
  if ( ! complete ) throw new Error( 'Site Directory requires a `complete` callback function.' )
  
  var debug = options.debug

  // flag that is switched when uploads are done
  var doneUploading = false
  var uploadedFiles = []
  var purger = async.queue( purge, 10 )
  purger.drain = purgeDrainHandler;

  var emitter = gcloudSiteDir( options, onUploaded )
  emitter.on( 'uploaded', function ( file ) {
    if ( debug ) console.log( `site-directory:uploaded:${ file.url }` )
    uploadedFiles.push( file.url )
    purger.push( file.url, function () { if ( debug ) console.log( `site-directory:purged:${ file.url }` ) } )
  } )

  function onUploaded ( error ) {
    if ( debug ) console.log( `site-directory:uploading-done:${ options.siteName }` )
    if ( error ) return complete( error )
    if ( uploadedFiles.length === 0 ) return complete()
    doneUploading = true
  }

  function toPurgeTask ( fileUrl ) {
    return function task ( taskComplete ) {
      return purge( fileUrl, taskComplete )
    }
  }

  function purgeDrainHandler () {
    if ( doneUploading && debug ) console.log( `site-directory:done:${ options.siteName }` )
    if ( doneUploading ) complete( null, Object.assign( {}, options, { uploadedFiles: uploadedFiles } )
  }
}
