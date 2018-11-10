var runInDir = require( './run-in-dir' )

module.exports = runGruntInit;

function runGruntInit ( options, callback ) {
  var dirName = options.dirName || '.';

  var params = ['init'];

  if ( ! options.hasOwnProperty( 'copycms' ) ) options.copycms = true;

  Object.keys ( options ).forEach( function ( optionKey ) {
    var optionValue = options[ optionKey ];
    params = params.concat( [ `--${ optionKey }=${ optionValue }` ] )
  } )

  if(options.node && options.grunt) {
    params.unshift(options.grunt);
  }

  runInDir(options.node || 'grunt', dirName, params, callback );

}
