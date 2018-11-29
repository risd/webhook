var runInDir = require( './run-in-dir' )

module.exports = runNpmInstall;

function runNpmInstall ( options ) {
  var dirName = options.dirName || '.';

  var runNpmFn = null;

  if(options.cache) {
    runNpmFn = function(cb) {
      runInDir(options.npm || 'npm', dirName, ['config', 'get', 'cache'], true, function( error, diroutput) {
        if ( error ) return cb( error )
        var oldCacheDir = diroutput.trim();
        runInDir(options.npm || 'npm', dirName, ['config', 'set', 'cache', options.cache], function( error ) {
          if ( error ) return cb( error )
          runInDir(options.npm || 'npm', dirName, ['install'], function() {
            runInDir(options.npm || 'npm', dirName, ['config', 'set', 'cache', oldCacheDir], function( error ) {
              if ( error ) return cb( error )
              cb();
            });
          });
        });
      });
    };
  } else {
    runNpmFn = function(cb) {
      runInDir(options.npm || 'npm', dirName, ['install'], function( error ) {
        if ( error ) return cb( error )
        cb();
      });
    }
  }

  return runNpmFn;
}
