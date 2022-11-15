'use strict';

const debug = require('debug')('conf')

const Firebase = require('./util/firebase/index')
const getUserLoginInformation = require( './util/get-user-login-information' )
const firebaseLoginUser = require( './util/firebase/login-user' )
const firebaseRetrieveSiteKey = require('./util/firebase/retrieve-site-key')

const escape = require('./util/escape-site')
const runGruntInit = require('./util/run-grunt-init')


module.exports = async function Conf (options, callback) {

  var firebase = Firebase(options)

  var config = {
    cwd: options.cwd || process.cwd(),
    platformName: options.platformName || 'webhook',
    siteName: escape(options.siteName),
    siteKey: null,
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: options.password,
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
  }

  if (config.webhookUsername && config.webhookPassword) {
    config.webhookEscapedUsername = escape(config.webhookUsername)
  }
  else {
    const { username, password } = await getUserLoginInformation()
    config.webhookUsername = username
    config.webhookEscapedUsername = escape(config.webhookUsername)
    config.webhookPassword = password
  }

  await firebaseLoginUser(config)
  if (!config.siteKey) {
    config.siteKey = await firebaseRetrieveSiteKey(config)
  }

  await runGruntInit({
    ...options,
    ...config,
  })
}
