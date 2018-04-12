module.exports = signalSiteReindex;


function signalSiteReindex ( options, callback ) {
  if ( !options ) options = {};

  var firebaseRoot = options.firebaseRoot;
  var indexData = options.indexData;
  
  firebaseRoot.child( 'management/commands/siteSearchReindex/' + indexData.sitename )
      .set( indexData, function ( error ) {
        if ( error ) console.log( 'Could not signal for search reindex.' )
        else console.log( 'Search reindex signal submitted.'.green )

        callback( error )
      } )
}
