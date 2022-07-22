module.exports.step = firebaseRetrieveSiteKeyStep;

function firebaseRetrieveSiteKeyStep ( configFn, step ) {
  var config = configFn()
  var firebase = config.firebase;

  firebase.siteKey( { siteName: config.siteName } )
    .then( function handleKeySnapshot ( keySnapshot ) {
      config.siteKey = keySnapshot.val()
      step()
    } )
    .catch( step )
}
