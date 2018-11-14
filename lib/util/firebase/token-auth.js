var inquirer = require( 'inquirer' )
var escapeEmail = require( '../escape-site.js' )

module.exports = firebaseTokenAuth;
module.exports.step = firebaseTokenAuthStep;
module.exports.stepFailOnError = firebaseTokenAuthStepFailOnError;

function firebaseTokenAuth ( config, step ) {
  var firebase = config.firebase;
  var firebaseToken = config.firebaseToken;

  if ( firebase.currentUser() ) {
    return step()
  }
  else if ( firebaseToken ) {
    firebase.tokenAuth( firebaseToken )
      .then( function () { step() } )
      .catch( step )
  }
  else {
    return step()
  }

}

function firebaseTokenAuthStep ( configFn, step ) {
  var config = configFn()
  firebaseTokenAuth( config, function ( error ) {
    // error should allow series to continue
    step()
  } )
}

function firebaseTokenAuthStepFailOnError ( configFn, step ) {
  var config = configFn()
  firebaseTokenAuth( config, function ( error ) {
    if ( error ) return step( error )
    step()
  } )
}
