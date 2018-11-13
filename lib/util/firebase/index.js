var firebase = require( 'firebase' )
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
}

FirebaseInterface.prototype.database = FirebaseDatabase;
FirebaseInterface.prototype.login = FirebaseLogin;
FirebaseInterface.prototype.createUser = FirebaseCreateUser;
FirebaseInterface.prototype.tokenAuth = FirebaseTokenAuth;
FirebaseInterface.prototype.siteKey = WebhookSiteKey;
FirebaseInterface.prototype.siteDevData = WebhookSiteDevData;
FirebaseInterface.prototype.siteContentTypes = WebhookSiteContentTypeSpecification;
FirebaseInterface.prototype.siteData = WebhookSiteData;
FirebaseInterface.prototype.currentUser = currentUser;
FirebaseInterface.prototype.reindex = WebhookSiteReindex;

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

function siteDataKeyPath ( options ) {
  return `buckets/${ options.siteName }/${ options.siteKey }/dev`
}

function siteContentTypeSpecificationKeyPath ( options ) {
  var keyPath = `${ siteDataKeyPath( options ) }/contentType`
  if ( options.contentType ) {
    keyPath += `/${ options.contentType }`
  }
  return keyPath
}

function siteContentTypeDataKeyPath ( options ) {
  var keyPath = `${ siteDataKeyPath( options ) }/data`
  if ( options.contentType ) {
    keyPath += `/${ options.contentType }`
  }
  if ( options.itemKey ) {
    keyPath += `/${ options.itemKey }`
  }
  return keyPath
}

function WebhookSiteKey ( options ) {
  var keyPath = `management/sites/${ escape( options.siteName ) }/key`
  return firebaseDatabaseOnceValueForKeyPath( keyPath )
}

function WebhookSiteReindex ( siteName, indexPayload ) {
  var keyPath = `management/commands/siteSearchReindex/${ siteName }`
  return firebaseDatabaseSetValueForKeyPath( keyPath, indexPayload )
}

function WebhookSiteDevData ( options ) {
  var keyPath = siteDataKeyPath( options )
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

function currentUser () {
  return firebase.auth().currentUser;
}

function firebaseDatabaseSetValueForKeyPath ( keyPath, value ) {
  return firebase.database().ref( keyPath ).set( value )
}

function firebaseDatabaseOnceValueForKeyPath ( keyPath ) {
  return firebase.database().ref( keyPath ).once( 'value' )
}
