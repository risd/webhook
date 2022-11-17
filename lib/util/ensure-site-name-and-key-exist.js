const debug = require("debug")("ensure-site-name-and-key-exist")
const fsp = require("node:fs/promises")
const path = require("node:path")

module.exports = ensureSiteNameAndKeyExist

/**
 * ensureSiteNameAndKeyExist
 * A common step of ensuring the defined `config` variable
 * includes the `siteName` and `siteKey`
 *
 * @param  {object} config
 * @param  {object} config
 */
async function ensureSiteNameAndKeyExist(config) {
  if (config.siteName && config.siteKey) return config

  try {
    const firebaseConfBuffer = await fsp.readFile(
      path.join(config.cwd, ".firebase.conf")
    )
    const firebaseConfJson = JSON.parse(firebaseConfBuffer.toString())
    config.siteName = firebaseConfJson.siteName
    config.siteKey = firebaseConfJson.siteKey
    return config
  } catch (error) {
    debug(error)
    throw error
  }
}
