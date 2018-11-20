// `npm view ${ generate } dist.tarball`
// request( tarball ).pipe( tar.x() )

var request = require( 'request' )
var async = require( 'async' )
var fs = require( 'fs' )

var npmViewTarball = require( './npm-view-tarball' )

module.exports = npmDownloadPackage;

function npmDownloadPackage ( packageOrUrl, step ) {

  var waterfall = []

  if ( packageOrUrl.startsWith( 'https://' ) || packageOrUrl.startsWith( 'http://' ) ) {
    // download the url
    var url = packageOrUrl.slice( 0 )
    waterfall = [ downloadTarball.bind( null, url ) ]
  }
  else {
    // download the package
    var package = packageOrUrl.slice( 0 )
    waterfall = [
      npmViewTarball.bind( null, package ),
      downloadTarball
    ]
  }

  async.waterfall( waterfall, handleWaterfall )

  function handleWaterfall ( error, tarballFileName ) {
    if ( error ) return step( error )
    step( null, tarballFileName )
  }
}

function downloadTarball ( tarballUrl, step ) {
  var tarballFileName = '.generate-repo.tgz'
  downloadFile( tarballUrl, tarballFileName, handleDownload )

  function handleDownload ( error ) {
    if ( error ) return step( error )
    step( null, tarballFileName )
  }
}

function downloadFile ( url, fileName, step ) {
  var fileRequest = request( url )
  var failedRequest = null;

  fileRequest
    .on( 'response', handleResponse )
    .pipe( fs.createWriteStream( fileName ) )
    .on( 'close', handleClose )

  function handleResponse ( response ) {
    if ( response.statusCode !== 200 ) {
      failedRequest = new Error( `Request failed: ${ url }` );
      fs.unlinkSync( fileName )
      step( failedRequest )
    }
  }

  function handleClose () {
    if ( failedRequest ) return;
    step( failedRequest, fileName )
  }
}
