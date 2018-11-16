var firebase = require( 'firebase' )
var uniqueId = require( '../unique-id' )
var escape = require( '../escape-site.js' )

module.exports = FirebaseInterface;

/**
 * Initialize the firebase interface.
 * 
 * @param {object} options
 * @param {string} options.firebaseName    The name of the firebase project
 * @param {string} options.firebaseAPIKey  The web API key for the Firebase project
 */
function FirebaseInterface ( options ) {
  if ( ! ( this instanceof FirebaseInterface ) ) return new FirebaseInterface( options )

  var config = {
    apiKey: options.firebaseAPIKey,
    authDomain: `${ options.firebaseName }.firebaseapp.com`,
    databaseURL: `https://${ options.firebaseName }.firebaseio.com`,
    projectId: options.firebaseName,
  }
  
  firebase.initializeApp( config )

  this.gruntInitParameter = config.projectId;
}

FirebaseInterface.prototype.database = FirebaseDatabase;
FirebaseInterface.prototype.login = FirebaseLogin;
FirebaseInterface.prototype.createUser = FirebaseCreateUser;
FirebaseInterface.prototype.tokenAuth = FirebaseTokenAuth;
FirebaseInterface.prototype.siteManagement = WebhookSiteManagement;
FirebaseInterface.prototype.siteManagementOnValue = WebhookSiteManagementOnValue;
FirebaseInterface.prototype.siteManagementOffValue = WebhookSiteManagementOffValue;
FirebaseInterface.prototype.siteMapDomain = WebhookSiteMapDomain;
FirebaseInterface.prototype.siteKey = WebhookSiteKey;
FirebaseInterface.prototype.siteOwners = WebhookSiteOwners;
FirebaseInterface.prototype.siteError = WebhookSiteError;
FirebaseInterface.prototype.siteDevData = WebhookSiteDevData;
FirebaseInterface.prototype.siteContentTypes = WebhookSiteContentTypeSpecification;
FirebaseInterface.prototype.siteData = WebhookSiteData;
FirebaseInterface.prototype.siteSettings = WebhookSiteSettings;
FirebaseInterface.prototype.siteDeploys = WebhookSiteDeploys;
FirebaseInterface.prototype.currentUser = currentUser;
FirebaseInterface.prototype.siteReindex = WebhookSiteReindex;
FirebaseInterface.prototype.siteCreate = WebhookSiteCreate;
FirebaseInterface.prototype.userSites = WebhookUserSites;
FirebaseInterface.prototype.userExists = WebhookUserExists;

function FirebaseDatabase () {
  return firebase.database()
}

function FirebaseLogin ( options ) {
  return firebase.auth().signInWithEmailAndPassword( options.email, options.password )
}

function FirebaseCreateUser ( options ) {
  return firebase.auth().createUserWithEmailAndPassword( options.email, options.password )
}

function FirebaseTokenAuth ( token ) {
  return firebase.auth().signInWithCustomToken( token )
}

function siteDevKeyPath ( options ) {
  return `buckets/${ options.siteName }/${ options.siteKey }/dev`
}

function siteContentTypeSpecificationKeyPath ( options ) {
  var keyPath = `${ siteDevKeyPath( options ) }/contentType`
  if ( options.contentType ) {
    keyPath += `/${ options.contentType }`
  }
  return keyPath
}

function siteContentTypeDataKeyPath ( options ) {
  var keyPath = `${ siteDevKeyPath( options ) }/data`
  if ( options.contentType ) {
    keyPath += `/${ options.contentType }`
  }
  if ( options.itemKey ) {
    keyPath += `/${ options.itemKey }`
  }
  return keyPath
}

function siteManagementPath ( options ) {
  return `management/sites/${ escape( options.siteName ) }`
}

function usersManagementPath (  ) {
  return `management/users`
}

function userManagementPath ( userEmail ) {
  return `${ usersManagementPath() }/${ escape( userEmail.toLowerCase() ) }`
}

function commandManagementPath () {
  return `management/commands`
}

function siteSearchReindexCommandPath ( siteName ) {
  return `${ commandManagementPath() }/siteSearchReindex/${ siteName }`
}

function createCommandPath ( siteName ) {
  return `${ commandManagementPath() }/create/${ siteName }`
}

function mapDomainCommandPath ( siteName ) {
  return `${ commandManagementPath() }/domainMap/${ siteName }`
}

function WebhookSiteManagement ( options ) {
  var keyPath = siteManagementPath( options )
  return firebaseDatabaseOnceValueForKeyPath( keyPath )
}

function WebhookSiteManagementOnValue ( options, snapshotHandler ) {
  var keyPath = siteManagementPath( options )
  return firebase.database().ref( keyPath ).on( 'value', snapshotHandler )
}

function WebhookSiteManagementOffValue ( options, snapshotHandler ) {
  var keyPath = siteManagementPath( options )
  return firebase.database().ref( keyPath ).off( 'value', snapshotHandler )
}

function WebhookSiteMapDomain ( options ) {
  var keyPath = mapDomainCommandPath( options.siteName )
  var mapDomainPayload = {
    id: uniqueId(),
    sitename: options.siteName,
    userid: options.webhookUsername,
    maskDomain: options.maskDomain,
  }
  if ( options.contentDomain ) mapDomainPayload.contentDomain = options.contentDomain
  return firebaseDatabaseSetValueForKeyPath( keyPath, mapDomainPayload )
}

function WebhookSiteKey ( options ) {
  var keyPath = `${ siteManagementPath( options ) }/key`
  return firebaseDatabaseOnceValueForKeyPath( keyPath )
}

function WebhookSiteOwners ( options, ownerData ) {
  var keyPath = `${ siteManagementPath( options ) }/owners`
  if ( ownerData ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, ownerData )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookSiteError ( options, error ) {
  var keyPath = `${ siteManagementPath( options ) }/error`
  if ( error ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, error )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookUserExists ( userEmail, userExists ) {
  var keyPath = `${ userManagementPath( userEmail ) }/exists`
  if ( typeof userExists === 'boolean' ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, userExists )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookUserSites ( userEmail ) {
  var keyPath = `${ userManagementPath( userEmail ) }/sites`
  return firebaseDatabaseOnceValueForKeyPath( keyPath )
}

function WebhookSiteReindex ( siteName, indexPayload ) {
  var keyPath = siteSearchReindexCommandPath( siteName )
  return firebaseDatabaseSetValueForKeyPath( keyPath, indexPayload )
}

function WebhookSiteCreate ( siteName, createPayload ) {
  var keyPath = createCommandPath( siteName )
  if ( createPayload ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, createPayload )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookSiteDevData ( options ) {
  var keyPath = siteDevKeyPath( options )
  return firebaseDatabaseOnceValueForKeyPath( keyPath )
}

function WebhookSiteContentTypeSpecification ( options, contentTypeSpecification ) {
  var keyPath = siteContentTypeSpecificationKeyPath( options )
  if ( contentTypeSpecification ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, contentTypeSpecification )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookSiteData ( options, contentTypeData ) {
  var keyPath = siteContentTypeDataKeyPath( options )
  if ( contentTypeData ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, contentTypeData )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookSiteSettings ( options, settingsData ) {
  var keyPath = `${ siteDevKeyPath( options ) }/settings`
  if ( settingsData ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, settingsData )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookSiteDeploys ( options, deploysData ) {
  var keyPath = `${ siteDevKeyPath( options ) }/deploys`
  if ( deploysData ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, deploysData )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function currentUser () {
  return firebase.auth().currentUser;
}

function firebaseDatabaseSetValueForKeyPath ( keyPath, value ) {
  return firebase.database().ref( keyPath ).set( value )
}

function firebaseDatabaseOnceValueForKeyPath ( keyPath ) {
  return firebase.database().ref( keyPath ).once( 'value' )
}

