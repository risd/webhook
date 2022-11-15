// `npm view ${ generate } dist.tarball`
// axios( tarball ).pipe( tar.x() )

var axios = require( 'axios' )
var async = require( 'async' )
var fs = require( 'fs' )
const path = require('path')

var npmViewTarball = require( './npm-view-tarball' )

module.exports = npmDownloadPackage;

async function npmDownloadPackage ({ packageOrUrl, cwd }) {

  var waterfall = []

  if ( packageOrUrl.startsWith( 'https://' ) || packageOrUrl.startsWith( 'http://' ) ) {
    // download the url
    var url = packageOrUrl.slice(0)
    return await downloadTarball({ url, cwd })
  }
  else {
    // download the package
    var package = packageOrUrl.slice( 0 )
    const url = await npmViewTarball({ package, cwd })
    return await downloadTarball({ url, cwd })
  }
}

async function downloadTarball ({ url, cwd }) {
  var tarballFileName = path.join(cwd, '.generate-repo.tgz')
  await downloadFile(url, tarballFileName)
  return tarballFileName
}

function downloadFile (url, fileName) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url,
      responseType: 'stream',
    }).then(function (response) {
        response.data.pipe(fs.createWriteStream(fileName))
          .on('error', function (error) {
            fs.unlinkSync(fileName)
            reject(error)
          })
          .on('close', function () {
            resolve(fileName)
          })
      })
      .catch(reject)
  })
}
