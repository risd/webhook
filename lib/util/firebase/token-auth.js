var inquirer = require( 'inquirer' )
var escapeEmail = require( '../escape-site.js' )

module.exports = firebaseTokenAuth;
module.exports.step = firebaseTokenAuthStep;
module.exports.stepPassError = firebaseTokenAuthStepPassError;

function firebaseTokenAuth ( config, step ) {
  var firebase = config.firebase;
  var firebaseToken = config.firebaseToken;

  if ( firebase.currentUser() ) {
    return step()
  }
  else if ( firebaseToken ) {
    firebase.tokenAuth( firebaseToken )
      .then( function authenticated () { step() } )
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

function firebaseTokenAuthStepPassError ( configFn, step ) {
  var config = configFn()
  firebaseTokenAuth( config, function ( error ) {
    if ( error ) return step( error )
    step()
  } )
}
