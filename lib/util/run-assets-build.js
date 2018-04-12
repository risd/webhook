var runInDir = require( './run-in-dir' )

module.exports = runAssetBuild;

function runAssetBuild ( options, step ) {
  if ( typeof options === 'function' ) {
    step = options;
    options = {};
  }

  var params = ['assets'];

  if(options.node && options.grunt) {
    params.unshift(options.grunt);
  }

  runInDir(options.node || 'grunt', '.', params, function() {
    step();
  });
}
