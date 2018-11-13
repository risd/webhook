var runInDir = require( './run-in-dir' )

module.exports = runGruntInit;

function runGruntInit ( options, callback ) {
  var dirName = options.dirName || '.';

  var params = ['init'];

  if ( ! options.hasOwnProperty( 'copycms' ) ) options.copycms = true;

  Object.keys ( options ).forEach( function ( optionKey ) {
    var optionValue = options[ optionKey ];
    if ( typeof optionValue === 'string' ||
         typeof optionValue === 'boolean' ||
         typeof optionValue === 'number' ) {
      params = params.concat( [ `--${ optionKey }=${ optionValue }` ] )
    }
    else if ( typeof optionValue === 'object' &&
              optionValue !== null &&
              optionValue.hasOwnProperty( 'gruntInitParameter' ) ) {
      params = params.concat( [ `--${ optionKey }=${ optionValue.gruntInitParameter }` ] )
    }
  } )

  if(options.node && options.grunt) {
    params.unshift(options.grunt);
  }
console.log( params )
  runInDir(options.node || 'grunt', dirName, params, callback );

}
