var async = require( 'async' )
var runInDir = require( './run-in-dir' )

module.exports = runGitInit;

function runGitInit ( options, callback ) {
  var dirName = options.dirName || '.';

  async.series( [
    runInDir.bind( null, 'git', dirName, [ 'init' ] ),
    runInDir.bind( null, 'git', dirName, [ 'add', '.' ] ),
    runInDir.bind( null, 'git', dirName, [ 'commit', '-m', '"initial"' ] ),
  ], callback )
}
