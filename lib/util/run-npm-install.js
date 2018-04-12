var runInDir = require( './run-in-dir' )

module.exports = runNpmInstall;

function runNpmInstall ( options ) {
  var runNpmFn = null;

  if(options.cache) {
    runNpmFn = function(cb) {
      runInDir(options.npm || 'npm', '.', ['config', 'get', 'cache'], true, function(diroutput) {
        var oldCacheDir = diroutput.trim();
        runInDir(options.npm || 'npm', '.', ['config', 'set', 'cache', options.cache], function() {
          runInDir(options.npm || 'npm', '.', ['install'], function() {
            runInDir(options.npm || 'npm', '.', ['config', 'set', 'cache', oldCacheDir], function() {
              cb();
            });
          });
        });
      });
    };
  } else {
    runNpmFn = function(cb) {
      runInDir(options.npm || 'npm', '.', ['install'], function() {
        cb();
      });
    }
  }

  return runNpmFn;
}
