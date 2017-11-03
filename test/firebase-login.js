var test = require( 'tape' )
var firebaseLogin = require( '../lib/firebase-login' )

var config = env();

var username = config.webhook.username;
var password = config.webhook.password;

firebaseLogin.setFirebaseName( config.firebase.name )

test( 'create-user', function ( t ) {

  var testResult = ensureNoErrorObjectData( t )

  firebaseLogin.createUser( username, password, testResult )

} )

test( 'user-login', function ( t ) {

  var testResult = ensureNoErrorObjectData( t )

  firebaseLogin.login( username, password, testResult )

} )

function ensureNoErrorObjectData ( t ) {

  t.plan( 2 )

  return function noErrorObjectData ( error, data ) {
    t.assert( error === null, 'No error.' )
    t.assert( typeof data === 'object', 'Success.' )
  }
}


function env () {

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
    }
  }

}
