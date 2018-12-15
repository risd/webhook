var runInDir = require( './run-in-dir' )
var exitCodeIsNotError = require( './run-in-dir' ).exitCodeIsNotError

module.exports = runAssetBuild;

function runAssetBuild ( options, step ) {
  if ( typeof options === 'function' ) {
    step = options;
    options = {};
  }

  var dirName = options.dirName || '.';

  var params = ['assets'];

  if(options.node && options.grunt) {
    params.unshift(options.grunt);
  }

  runInDir(options.node || 'grunt', dirName, params, function( exitCode ) {
    if( exitCodeIsNotError( exitCode ) ) return step()
    else step( new Error( 'Could not complete asset build. Scroll up to see where the error occurred.' ) )
  });
}
