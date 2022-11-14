const debug = require('debug')('ensure-site-name-and-key-exist')
const fsp = require('node:fs/promises')

module.exports = ensureSiteNameAndKeyExist;

/**
 * ensureSiteNameAndKeyExist
 * A common step of ensuring the defined `config` variable
 * includes the `siteName` and `siteKey`
 * 
 * @param  {object} config
 * @param  {object} config
 */
async function ensureSiteNameAndKeyExist (config) {
  if (config.siteName && config.siteKey) return config

  try {
    const firebaseConfBuffer = await fsp.readFile('.firebase.conf')
    const firebaseConfJson = JSON.parse(firebaseConfBuffer.toString())
    config.siteName = json.siteName
    config.siteKey = json.siteKey
    return config
  }
  catch (error) {
    debug(error)
    throw error
  }
}
