var firebase = require( 'firebase' )
var uniqueId = require( '../unique-id' )
var escape = require( '../escape-site.js' )
var unescape = require( '../unescape-site.js' )
var request = require( 'request-promise-native' )
var fsParseJson = require( '../fs-parse-json.js' )
var getRestAccessToken = require( './rest-access-token.js' )

module.exports = FirebaseInterface;

/**
 * Initialize the firebase interface.
 * 
 * @param {object} options
 * @param {string} options.firebaseName    The name of the firebase project
 * @param {string} options.firebaseAPIKey  The web API key for the Firebase project
 * @param {string|object} options.firebaseServiceAccountKey?  Optional path to json object, or json object representing the firebase service account key
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

  this._firebaseName = options.firebaseName;
  this.gruntInitParameter = options.firebaseName;

  if ( options.firebaseServiceAccountKey && typeof options.firebaseServiceAccountKey === 'string' ) {
    options.firebaseServiceAccountKey = require( options.firebaseServiceAccountKey )
  }
  if ( options.firebaseServiceAccountKey && typeof options.firebaseServiceAccountKey === 'object' ) {
    this._getAccessToken = getRestAccessToken.bind( this, options.firebaseServiceAccountKey )
  }
  else {
    this._getAccessToken = function returnRejectedPromiseFn () {
      return new Promise( function ( resolve, reject ) {
        return reject( new Error( 'Pass firebaseServiceAccountKey to acquire a REST access token.' ) );
      } )
    }
  }
}

FirebaseInterface.prototype.database = FirebaseDatabase;
FirebaseInterface.prototype.login = FirebaseLogin;
FirebaseInterface.prototype.createUser = WebhookUserCreate;
FirebaseInterface.prototype.tokenAuth = FirebaseTokenAuth;
FirebaseInterface.prototype.siteManagement = WebhookSiteManagement;
FirebaseInterface.prototype.siteManagementOnValue = WebhookSiteManagementOnValue;
FirebaseInterface.prototype.siteManagementOffValue = WebhookSiteManagementOffValue;
FirebaseInterface.prototype.siteMapDomain = WebhookSiteMapDomain;
FirebaseInterface.prototype.siteKey = WebhookSiteKey;
FirebaseInterface.prototype.siteGithub = WebhookSiteGithub;
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

function WebhookUserCreate ( options ) {
  return FirebaseCreateUser( options ).then( setUserExists )

  function setUserExists () {
    return WebhookUserExists( options.email, true )
  }
}

function FirebaseCreateUser ( options ) {
  return firebase.auth().createUserWithEmailAndPassword( options.email, options.password )
}

function FirebaseTokenAuth ( token ) {
  return firebase.auth().signInWithCustomToken( token )
}

function siteDataKeyPath ( options ) {
  return `buckets/${ escape( options.siteName ) }/${ options.siteKey }`
}

function siteDevKeyPath ( options ) {
  return `${ siteDataKeyPath( options ) }/dev`
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
  var base = `management/sites`
  if ( options && options.siteName ) {
    return `${ base }/${ escape( options.siteName ) }`  
  }
  else {
    return base;
  }
  
}

function usersManagementPath () {
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

function WebhookSiteKey ( options, siteKey ) {
  var keyPath = `${ siteManagementPath( options ) }/key`
  if ( siteKey ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, siteKey )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
}

function WebhookSiteGithub ( options, siteGithub ) {
  var keyPath = `${ siteManagementPath( options ) }/github`
  if ( typeof siteGithub === 'string' ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, siteGithub )
  }
  else if ( siteGithub === null ) {
    // remove
    return firebaseDatabaseSetValueForKeyPath( keyPath, null )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }
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

function WebhookSiteDevData ( options, siteData ) {
  var keyPath = siteDevKeyPath( options )
  if ( siteData ) {
    // set
    return firebaseDatabaseSetValueForKeyPath( keyPath, siteData )
  }
  else {
    return firebaseDatabaseOnceValueForKeyPath( keyPath )  
  }
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
  var setMethod = appropriateSetMethod( contentTypeData )
  if ( setMethod && setMethod.sdk  ) {
    // set via sdk
    return firebaseDatabaseSetValueForKeyPath( keyPath, contentTypeData )
  }
  else if ( setMethod && setMethod.rest ) {
    // set via rest
    return firebaseDatabaseSetLargeValueForKeyPath.call( this, keyPath, contentTypeData )
  }
  else if ( setMethod ) {
    return Promise.reject( new Error( 'File is too big to set.' ) )
  }
  else {
    // get
    return firebaseDatabaseOnceValueForKeyPath( keyPath )
  }

  function appropriateSetMethod ( siteData ) {
    if ( ! siteData ) return false;
    var dataSize = sizeOf( siteData )

    // sizes defined: https://firebase.google.com/docs/database/usage/limits#writes
    return {
      sdk: fitsInSDK( dataSize ),
      rest: fitsInREST( dataSize ),
    }
  }

  function fitsInSDK ( dataSize ) {
    var maxSDKSize = 16 * 1024 * 1024; // 16MB
    return dataSize <= maxSDKSize
  }

  function fitsInREST ( dataSize ) {
    var maxRESTSize = 256 * 1024 * 1024; // 256MB
    return dataSize <= maxRESTSize;
  }

  function sizeOf ( data ) {
    return Buffer( JSON.stringify( data ) ).length
  }
}

function firebaseDatabaseSetLargeValueForKeyPath ( keyPath, value ) {
  var uri = `https://${ this._firebaseName }.firebaseio.com/${ keyPath }.json`
  return this._getAccessToken()
    .then( function ( token ) {
      uri += `?access_token=${ token }`
      var putOptions = {
        method: 'PUT',
        uri: uri,
        body: value,
        json: true,
      }
      return request.put( putOptions )
    } )
    // .catch( function ( error ) { console.log( error ) } )
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
