var async = require( 'async' )
var request = require( 'request' )

module.exports = CDNPurge;

function CDNPurge ( fileUrl, complete ) {
  // fileUrl includes protocol
  if ( fileUrl.startsWith( 'http' ) ) {
    return purge( fileUrl, complete )
  }

  // protocol-less URL, purge both http & https
  async.parallel( [
    makePurgeTask( [ 'http', fileUrl ].join( '://' ) ),
    makePurgeTask( [ 'https', fileUrl ].join( '://' ) )
  ], function parallelPurgeHandler ( error, results ) {
    complete( error, fileUrl )
  } )
}

function makePurgeTask ( fileUrl ) {
  return function purgeTask ( next ) {
    purge( fileUrl, next )
  }
}

function purge ( purgeUrl, next ) {
  if ( purgeUrl.endsWith( '/index.html' ) ) {
    purgeUrl = purgeUrl.replace( '/index.html', '/' )
  }

  var requestOptions = { method: 'PURGE', url: purgeUrl }

  try {
    request( requestOptions, function ( error, response, body ) {
      next( null, purgeUrl )
    } )  
  }
  catch ( error ) {
    next( null, purgeUrl )
  }
}