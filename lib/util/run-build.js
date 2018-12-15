var runInDir = require( './run-in-dir' )
var exitCodeIsNotError = require( './run-in-dir' ).exitCodeIsNotError

module.exports = runBuild;

function runBuild ( options, step ) {
  var dirName = options.dirName || '.';

  if ( typeof options === 'function' ) {
    step = options;
    options = {};
  }

  var params = ['build', '--strict=true'];

  if(options.node && options.grunt) {
    params.unshift(options.grunt);
  }

  runInDir(options.node || 'grunt', dirName, params, false, function(exitCode, output) {
    if ( exitCodeIsNotError( exitCode ) ) return step()
    else {
      console.log('\n========================================================'.red);
      console.log('# Deploy halted. Templates not pushed.'.red);
      console.log('========================================================'.red);
      console.log('# There was an error in your build and we don\'t want to'.red);
      console.log('# deploy it to your live version. Please check over your'.red);
      console.log('# templates before trying to deploy again.'.red);
      console.log('# ---------------------------------------------------- #'.red)
      step( new Error( 'Could not build site. Scroll up to see where the error occurred.' ) )
    }
  });

}
