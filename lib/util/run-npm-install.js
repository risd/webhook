var runInDir = require( './run-in-dir' )

module.exports = runNpmInstall;

function runNpmInstall ( options ) {
  var dirName = options.dirName || '.';

  var runNpmFn = null;

  if(options.cache) {
    runNpmFn = function(cb) {
      runInDir(options.npm || 'npm', dirName, ['config', 'get', 'cache'], true, function(diroutput) {
        var oldCacheDir = diroutput.trim();
        runInDir(options.npm || 'npm', dirName, ['config', 'set', 'cache', options.cache], function() {
          runInDir(options.npm || 'npm', dirName, ['install'], function() {
            runInDir(options.npm || 'npm', dirName, ['config', 'set', 'cache', oldCacheDir], function() {
              cb();
            });
          });
        });
      });
    };
  } else {
    runNpmFn = function(cb) {
      runInDir(options.npm || 'npm', dirName, ['install'], function() {
        cb();
      });
    }
  }

  return runNpmFn;
}
