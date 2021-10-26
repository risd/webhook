module.exports = function env () {

  require('dotenv-safe').load( {
    sample: __dirname + '/../.testenv.example',
    path: __dirname + '/../.testenv',
  } )

  return {
    firebaseInterface: {
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
      firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
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
    siteNameKey: {
      siteName: process.env.WEBHOOK_SITENAME,
      siteKey: process.env.WEBHOOK_SITEKEY,
    },
    utilSiteDir: {
      keyFile: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      siteName: process.env.WEBHOOK_SITENAME,
    },
    utilPackageUpdate: {
      platformName: process.env.PLATFORM_NAME,
    },
  }

}
