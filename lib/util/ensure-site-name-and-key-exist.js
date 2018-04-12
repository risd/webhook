module.exports = ensureSiteNameAndKeyExist;

/**
 * ensureSiteNameAndKeyExist
 * A common step of ensuring the defined `config` variable
 * includes the `sitename` and `sitekey` per the .firebase.conf
 *
 * Returns an asynchronous task to be run in series
 * if no callback is provided
 * 
 * @param  {object}   config
 * @param  {Function} callback?  Optionally define the async hook with options
 * @return {Function} task       The task to run
 */
function ensureSiteNameAndKeyExist ( config, callback ) {
  var fs = require('fs');

  if ( typeof callback === 'function' ) return task( callback );
  else return task;

  function task ( step ) {
    if ( config.sitename && config.sitekey ) return step()

    fs.readFile( '.firebase.conf', function ( error, firebaseConf ) {
      if ( error ) return step( error )
      
      var json = JSON.parse( firebaseConf.toString() )
      
      config.sitename = json.siteName;
      config.sitekey = json.secretKey;
      
      step();
    } )

  }
}
