// `npm view ${ generate } dist.tarball`
// axios( tarball ).pipe( tar.x() )

var axios = require( 'axios' )
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
  axios( {
    method: 'get',
    url: url,
    responseType: 'stream',
  } )
    .then( function ( response ) {
      response.data.pipe( fs.createWriteStream( fileName ) )
        .on( 'error', function ( error ) {
          fs.unlinkSync( fileName )
          step( error )
        } )
        .on( 'close', function () {
          step( null, fileName )
        } )
    } )
    .catch( step )
}
