var fs = require( 'fs' )

module.exports = ensureSiteNameAndKeyExist;
module.exports.step = ensureSiteNameAndKeyExistStep;

/**
 * ensureSiteNameAndKeyExist
 * A common step of ensuring the defined `config` variable
 * includes the `sitename` and `sitekey` per the .firebase.conf
 * 
 * @param  {object}   config
 * @param  {Function} callback
 */
function ensureSiteNameAndKeyExist ( config, callback ) {
  if ( config.siteName && config.siteKey ) return callback()

  fs.readFile( '.firebase.conf', function ( error, firebaseConf ) {
    if ( error ) return callback( error )
    
    try {
      var json = JSON.parse( firebaseConf.toString() )  
    } catch ( error ) {
      return callback( error )
    }
    
    
    config.siteName = json.siteName;
    config.siteKey = json.siteKey;
    
    callback()
  } )
}

function ensureSiteNameAndKeyExistStep ( configFn, step ) {
  ensureSiteNameAndKeyExist( configFn(), step )
}
