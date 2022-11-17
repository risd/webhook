const debug = require('debug')('util-signal-site-reindex')
const uniqueId = require( './unique-id' )

module.exports = signalSiteReindex

async function signalSiteReindex ({
  firebase,
  siteName,
  webhookUsername,
}) {

  var indexData = {
    userid: webhookUsername,
    sitename: siteName,
    id: uniqueId(),
  }

  try {
    await firebase.reindex( siteName, indexData )
    debug('signal submitted')
  }
  catch (error) {
    debug('could not signal')
    throw error
  }
}
