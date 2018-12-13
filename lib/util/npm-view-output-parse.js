module.exports = npmViewOutputParse;

function npmViewOutputParse ( callback ) {
  return function processNpmOutput ( error, output ) {
    if ( error ) {
      return callback( error )
    }
    if ( output ) {
      try {
        return callback( null, findValue( output.toString() ) )
      }
      catch ( error ) {
        callback( new Error( 'Could not capture output.' ) )  
      }
    }
    else {
      callback( new Error( 'Could not capture output.' ) )
    }
  }
}

function findValue ( output ) {
  var lines = output.trim().split( '\n' )
  if ( lines.length === 1 ) return lines[ 0 ];

  lines = lines.filter( doesNotstartsWithSpaces ).filter( isNotEmpty )

  var latest = lines[ lines.length - 1 ]
  var latestUrl = latest.split( ' ' )[ 1 ]
  return latestUrl.slice( 1, -1 )
}

function doesNotstartsWithSpaces ( line ) {
  return ! line.startsWith( '  ' )
}

function isNotEmpty ( line ) {
  return line.length > 0
}