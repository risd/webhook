var wrench = require( 'wrench' )

module.exports = runRmRf;

function runRmRf ( directory, callback ) {
  wrench.rmdirRecursive( directory, callback )
}
