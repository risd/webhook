module.exports = function env () {

  require('dotenv-safe').load( {
    sample: __dirname + '/../.testenv.example',
    path: __dirname + '/../.testenv',
  } )

  return {
    firebase: {
      name: process.env.FIREBASE_NAME
    },
    webhook: {
      username: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
    },
    push: {
      custom: true,
      server: process.env.WEBHOOK_SERVER,
      siteName: process.env.WEBHOOK_SITENAME,
      siteKey: process.env.WEBHOOK_SITEKEY,
    },
    cdnPurge: {
      url: process.env.PURGE_URL,
    },
    downloadGenerate: {
      generate: process.env.GENERATE,
    },
  }

}
