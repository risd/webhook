const fs = require( 'node:fs/promises' )

const Firebase = require('./util/firebase/index')
const ensureSiteNameAndKeyExist = require('./util/ensure-site-name-and-key-exist' )

module.exports = async function PresetBuild (options) {

  const firebase = Firebase( options )

  const config = {
    cwd: options.cwd || process.cwd(),
    siteName: options.siteName || null,
    siteKey: options.siteKey || null,
    platformName: options.platformName || 'webhook',
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebase: firebase,
    pathToWrite: options.toFile || 'preset-data.json',
    all: options.all || true, // download all site data?, or just content type data
  }

  await ensureSiteNameAndKeyExist(config)

  let data = {}
  if (config.all) {
    const snapshot = await firebase.siteDevData(config)
    data = snapshot.val()
  }
  else {
    const snapshot = await firebase.siteContentTypes(config)
    data = snapshot.val()
  }

  await fs.writeFile( config.pathToWrite, JSON.stringify(data, null, 2))
  return
}
