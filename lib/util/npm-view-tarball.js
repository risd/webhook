var runInDir = require( './run-in-dir' )

module.exports = npmViewTarball;

function npmViewTarball ( package, step ) {
  runInDir( 'npm', '.', [ 'view', package, 'dist.tarball' ], true, hanldeTarBall )

  function hanldeTarBall ( tarballError, tarballOutput ) {
    if ( tarballOutput ) {
      try {
        return step( null, findUrl( tarballOutput.toString() ) )
      } catch( error ) {
        return step( error )
      }
    }
    else step( new Error( tarballOutput ) )
  }
}

function findUrl ( output ) {
  var lines = output.trim().split( '\n' )
  if ( lines.length === 1 ) return lines[ 0 ];

  var latest = lines[ lines.length - 1 ]
  var latestUrl = latest.split( ' ' )[ 1 ]
  return latestUrl.slice( 1, -1 )
}
