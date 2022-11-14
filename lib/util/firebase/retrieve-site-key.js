const { ERROR_FIREBASE_RETRIEVING_SITE_KEY } = require('../../errors')

module.exports.step = firebaseRetrieveSiteKeyStep;

function firebaseRetrieveSiteKeyStep ({ firebase, siteName }) {
  return firebase.siteKey({ siteName })
    .then( function handleKeySnapshot ( keySnapshot ) {
      return keySnapshot.val()
    })
    .catch((error) => {
      error.code = ERROR_FIREBASE_RETRIEVING_SITE_KEY
      throw error
    })
}
