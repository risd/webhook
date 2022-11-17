const { initializeApp } = require("firebase/app")
const {
  getDatabase,
  ref,
  child,
  set,
  get,
  onValue,
  goOffline,
} = require("firebase/database")
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdToken,
} = require("firebase/auth")
var uniqueId = require("../unique-id")
var escape = require("../escape-site.js")
var unescape = require("../unescape-site.js")
var axios = require("axios")

let db, dbRef, auth

module.exports = FirebaseInterface

/**
 * Initialize the firebase interface.
 *
 * @param {object} options
 * @param {string} options.firebaseName    The name of the firebase project
 * @param {string} options.firebaseAPIKey  The web API key for the Firebase project
 */
function FirebaseInterface(options) {
  if (!(this instanceof FirebaseInterface))
    return new FirebaseInterface(options)

  var config = {
    apiKey: options.firebaseAPIKey,
    authDomain: `${options.firebaseName}.firebaseapp.com`,
    databaseURL: `https://${options.firebaseName}.firebaseio.com`,
    projectId: options.firebaseName,
  }

  const app = initializeApp(config)
  db = getDatabase(app)
  dbRef = ref(db)
  auth = getAuth(app)

  this._firebaseName = options.firebaseName
  this.gruntInitParameter = options.firebaseName
}

FirebaseInterface.prototype.database = FirebaseDatabase
FirebaseInterface.prototype.databaseRef = FirebaseDatabaseRef
FirebaseInterface.prototype.login = FirebaseLogin
FirebaseInterface.prototype.createUser = WebhookUserCreate
FirebaseInterface.prototype.siteManagement = WebhookSiteManagement
FirebaseInterface.prototype.siteManagementOnValue = WebhookSiteManagementOnValue
FirebaseInterface.prototype.siteMapDomain = WebhookSiteMapDomain
FirebaseInterface.prototype.siteKey = WebhookSiteKey
FirebaseInterface.prototype.siteGithub = WebhookSiteGithub
FirebaseInterface.prototype.siteOwners = WebhookSiteOwners
FirebaseInterface.prototype.siteError = WebhookSiteError
FirebaseInterface.prototype.siteDevData = WebhookSiteDevData
FirebaseInterface.prototype.siteContentTypes =
  WebhookSiteContentTypeSpecification
FirebaseInterface.prototype.siteData = WebhookSiteData
FirebaseInterface.prototype.siteSettings = WebhookSiteSettings
FirebaseInterface.prototype.siteDeploys = WebhookSiteDeploys
FirebaseInterface.prototype.currentUser = currentUser
FirebaseInterface.prototype.siteReindex = WebhookSiteReindex
FirebaseInterface.prototype.siteCreate = WebhookSiteCreate
FirebaseInterface.prototype.userSites = WebhookUserSites
FirebaseInterface.prototype.userExists = WebhookUserExists
FirebaseInterface.prototype.goOffline = FirebaseGoOffline

function FirebaseDatabase() {
  return db
}

function FirebaseDatabaseRef() {
  return dbRef
}

function FirebaseLogin(options) {
  return signInWithEmailAndPassword(auth, options.email, options.password)
}

function WebhookUserCreate(options) {
  return FirebaseCreateUser(options).then(setUserExists)

  function setUserExists() {
    return WebhookUserExists(options.email, true)
  }
}

function FirebaseCreateUser(options) {
  return createUserWithEmailAndPassword(auth, options.email, options.password)
}

function siteDataKeyPath(options) {
  return `buckets/${escape(options.siteName)}/${options.siteKey}`
}

function siteDevKeyPath(options) {
  return `${siteDataKeyPath(options)}/dev`
}

function siteContentTypeSpecificationKeyPath(options) {
  var keyPath = `${siteDevKeyPath(options)}/contentType`
  if (options.contentType) {
    keyPath += `/${options.contentType}`
  }
  return keyPath
}

function siteContentTypeDataKeyPath(options) {
  var keyPath = `${siteDevKeyPath(options)}/data`
  if (options.contentType) {
    keyPath += `/${options.contentType}`
  }
  if (options.itemKey) {
    keyPath += `/${options.itemKey}`
  }
  return keyPath
}

function siteManagementPath(options) {
  var base = `management/sites`
  if (options && options.siteName) {
    return `${base}/${escape(options.siteName)}`
  } else {
    return base
  }
}

function usersManagementPath() {
  return `management/users`
}

function userManagementPath(userEmail) {
  return `${usersManagementPath()}/${escape(userEmail.toLowerCase())}`
}

function commandManagementPath() {
  return `management/commands`
}

function siteSearchReindexCommandPath(siteName) {
  return `${commandManagementPath()}/siteSearchReindex/${siteName}`
}

function createCommandPath(siteName) {
  return `${commandManagementPath()}/create/${siteName}`
}

function mapDomainCommandPath(siteName) {
  return `${commandManagementPath()}/domainMap/${siteName}`
}

function WebhookSiteManagement(options) {
  var keyPath = siteManagementPath(options)
  return firebaseDatabaseOnceValueForKeyPath(keyPath)
}

function WebhookSiteManagementOnValue(options, snapshotHandler) {
  var keyPath = siteManagementPath(options)
  return onValue(child(dbRef, keyPath), snapshotHandler)
}

function WebhookSiteMapDomain(options) {
  var keyPath = mapDomainCommandPath(options.siteName)
  var mapDomainPayload = {
    id: uniqueId(),
    sitename: options.siteName,
    userid: options.webhookUsername,
    maskDomain: options.maskDomain,
  }
  if (options.contentDomain)
    mapDomainPayload.contentDomain = options.contentDomain
  return firebaseDatabaseSetValueForKeyPath(keyPath, mapDomainPayload)
}

function WebhookSiteKey(options, siteKey) {
  var keyPath = `${siteManagementPath(options)}/key`
  if (siteKey) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, siteKey)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookSiteGithub(options, siteGithub) {
  var keyPath = `${siteManagementPath(options)}/github`
  if (typeof siteGithub === "string") {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, siteGithub)
  } else if (siteGithub === null) {
    // remove
    return firebaseDatabaseSetValueForKeyPath(keyPath, null)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookSiteOwners(options, ownerData) {
  var keyPath = `${siteManagementPath(options)}/owners`
  if (ownerData) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, ownerData)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookSiteError(options, error) {
  var keyPath = `${siteManagementPath(options)}/error`
  if (error) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, error)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookUserExists(userEmail, userExists) {
  var keyPath = `${userManagementPath(userEmail)}/exists`
  if (typeof userExists === "boolean") {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, userExists)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookUserSites(userEmail) {
  var keyPath = `${userManagementPath(userEmail)}/sites`
  return firebaseDatabaseOnceValueForKeyPath(keyPath)
}

function WebhookSiteReindex(siteName, indexPayload) {
  var keyPath = siteSearchReindexCommandPath(siteName)
  return firebaseDatabaseSetValueForKeyPath(keyPath, indexPayload)
}

function WebhookSiteCreate(siteName, createPayload) {
  var keyPath = createCommandPath(siteName)
  if (createPayload) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, createPayload)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookSiteDevData(options, siteData) {
  var keyPath = siteDevKeyPath(options)
  if (siteData) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, siteData)
  } else {
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookSiteContentTypeSpecification(
  options,
  contentTypeSpecification
) {
  var keyPath = siteContentTypeSpecificationKeyPath(options)
  if (contentTypeSpecification) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, contentTypeSpecification)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

// options : { siteName : string , siteKey : string, forceREST : boolean }
function WebhookSiteData(options, contentTypeData) {
  var keyPath = siteContentTypeDataKeyPath(options)
  var setMethod = appropriateSetMethod(contentTypeData)

  // allow user to force using REST, which can handle any file
  // size, instead of using the SDK.
  if (options.forceREST && setMethod) {
    setMethod.sdk = false
    setMethod.rest = true
  }

  if (setMethod && setMethod.sdk) {
    // set via sdk
    return firebaseDatabaseSetValueForKeyPath(keyPath, contentTypeData)
  } else if (setMethod && setMethod.rest) {
    // set via rest
    return firebaseDatabaseSetLargeValueForKeyPath.call(
      this,
      keyPath,
      contentTypeData
    )
  } else if (setMethod) {
    return Promise.reject(new Error("File is too big to set."))
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }

  function appropriateSetMethod(siteData) {
    if (!siteData) return false
    var dataSize = sizeOf(siteData)

    // sizes defined: https://firebase.google.com/docs/database/usage/limits#writes
    return {
      sdk: fitsInSDK(dataSize),
      rest: fitsInREST(dataSize),
    }
  }

  function fitsInSDK(dataSize) {
    var maxSDKSize = 16 * 1024 * 1024 // 16MB
    return dataSize <= maxSDKSize
  }

  function fitsInREST(dataSize) {
    var maxRESTSize = 256 * 1024 * 1024 // 256MB
    return dataSize <= maxRESTSize
  }

  function sizeOf(data) {
    return Buffer(JSON.stringify(data)).length
  }
}

function firebaseDatabaseSetLargeValueForKeyPath(keyPath, value) {
  var uri = `https://${this._firebaseName}.firebaseio.com/${keyPath}.json`

  return getIdToken(this.currentUser(), true).then(function (token) {
    uri += `?auth=${token}`
    var putOptions = {
      json: true,
    }
    return axios.put(uri, value, putOptions)
  })
}

function WebhookSiteSettings(options, settingsData) {
  var keyPath = `${siteDevKeyPath(options)}/settings`
  if (settingsData) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, settingsData)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function WebhookSiteDeploys(options, deploysData) {
  var keyPath = `${siteDevKeyPath(options)}/deploys`
  if (deploysData) {
    // set
    return firebaseDatabaseSetValueForKeyPath(keyPath, deploysData)
  } else {
    // get
    return firebaseDatabaseOnceValueForKeyPath(keyPath)
  }
}

function currentUser() {
  return auth.currentUser
}

function firebaseDatabaseSetValueForKeyPath(keyPath, value) {
  return set(child(dbRef, keyPath), value)
}

function firebaseDatabaseOnceValueForKeyPath(keyPath) {
  return get(child(dbRef, keyPath))
}

function FirebaseGoOffline() {
  return goOffline(db)
}
