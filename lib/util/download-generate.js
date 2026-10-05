// `npm view ${ generate } dist.tarball`
// fetch( tarball ).pipe( tar.x() )

const debug = require("debug")("download-generate")
const { createWriteStream, unlinkSync } = require("node:fs")
const path = require("node:path")
const { Readable } = require("node:stream")
const { finished } = require("node:stream/promises")

var npmViewTarball = require("./npm-view-tarball")

module.exports = npmDownloadPackage

async function npmDownloadPackage({ packageOrUrl, cwd }) {
  var waterfall = []

  if (
    packageOrUrl.startsWith("https://") ||
    packageOrUrl.startsWith("http://")
  ) {
    // download the url
    var url = packageOrUrl.slice(0)
    return await downloadTarball({ url, cwd })
  } else {
    // download the package
    var package = packageOrUrl.slice(0)
    const url = await npmViewTarball({ package, cwd })
    return await downloadTarball({ url, cwd })
  }
}

async function downloadTarball({ url, cwd }) {
  var tarballFileName = path.join(cwd, ".generate-repo.tgz")
  await downloadFile(url, tarballFileName)
  return tarballFileName
}

function downloadFile(url, fileName) {
  return new Promise(async (resolve, reject) => {
    try {
      await fetchToFile({ url, localFile: fileName })
      resolve(fileName)
    } catch (error) {
      console.error(error)
      fs.unlinkSync(fileName)
      reject(error)
    }
  })
}

async function fetchToFile({ url, localFile }) {
  const res = await fetch(url)
  await finished(Readable.fromWeb(res.body).pipe(createWriteStream(localFile)))
}
