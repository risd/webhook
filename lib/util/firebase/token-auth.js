var inquirer = require( 'inquirer' )
var escapeEmail = require( '../escape-site.js' )

module.exports.step = firebaseTokenAuthStep;
module.exports.stepFailOnError = firebaseTokenAuthStepFailOnError;

function firebaseTokenAuthStep ( configFn, step ) {
  var config = configFn()
  var firebase = config.firebase;
  var firebaseToken = config.firebaseToken;
  if ( firebase.currentUser() ) {
    return step()
  }
  else if ( firebaseToken ) {
    firebase.tokenAuth( firebaseToken )
      .then( step )
      .catch( function ( error ) {
        // error should allow series to continue
        step()
      } )
  }
  else {
    return step()
  }
}

function firebaseTokenAuthStepFailOnError ( configFn, step ) {
  var config = configFn()
  var firebase = config.firebase;
  var firebaseToken = config.firebaseToken;
  if ( firebase.currentUser() ) {
    return step()
  }
  else if ( firebaseToken ) {
    firebase.tokenAuth( firebaseToken )
      .then( step )
      .catch( step )
  }
  else {
    return step()
  }
}
