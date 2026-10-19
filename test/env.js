module.exports = function env() {
  require("dotenv-safe").load({
    sample: __dirname + "/../.testenv.example",
    path: __dirname + "/../.testenv",
  })

  return {
    firebaseInterface: {
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
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
    create: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      generate: process.env.GENERATE,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
    },
    conf: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
    },
    init: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
    },
    backup: {
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
    },
    restore: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
    },
    deploys: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
    },
    listSites: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
    },
    deployStatic: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
      gcloud: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    },
    pushStatic: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      gcloud: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    },
    update: {
      email: process.env.WEBHOOK_USERNAME,
      password: process.env.WEBHOOK_PASSWORD,
      platformName: process.env.PLATFORM_NAME,
      platformDomain: process.env.PLATFORM_DOMAIN,
      firebaseName: process.env.FIREBASE_NAME,
      firebaseAPIKey: process.env.FIREBASE_API_KEY,
      generate: process.env.GENERATE,
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
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      siteName: process.env.WEBHOOK_SITENAME,
    },
    utilPackageUpdate: {
      platformName: process.env.PLATFORM_NAME,
    },
  }
}
