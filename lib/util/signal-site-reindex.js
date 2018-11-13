var uniqueId = require( './unique-id' )

module.exports.step = signalSiteReindexStep;


function signalSiteReindexStep ( configFn, step ) {
  var config = configFn()

  var firebase = config.firebase;
  var siteName = config.siteName;

  var indexData = {
    userid: config.webhookUsername,
    sitename: siteName,
    id: uniqueId(),
  }

  firebase.reindex( siteName, indexData )
    .then( handleSetReindex )
    .catch( catchSetReindex )

  function handleSetReindex () {
    console.log( 'Search reindex signal submitted.'.green )
    step()
  }

  function catchSetReindex ( error ) {
    console.log( 'Could not signal for search reindex.' )
    step( error )
  }
}
