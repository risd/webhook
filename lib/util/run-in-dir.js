var debug = require( 'debug' )( 'run-in-dir' )
var winSpawn = require('win-spawn');

module.exports = runInDir;
module.exports.exitCodeIsNotError = exitCodeIsNotError;

function runInDir(command, cwd, args, pipe, callback) {  

  debug( `cd ${ cwd } && ${ command } ${ args.join( ' ' ) }` )

  if(typeof pipe === 'function') {
    callback = pipe;
    pipe = false;
  }

  var command = winSpawn(command, args, {
    stdio: [process.stdin, pipe ? 'pipe' : process.stdout, process.stderr],
    cwd: cwd
  });

  var output = '';
  var errorOutput = null;

  if(pipe) {
    command.stdout.on('data', function (data) {
      output += data;
    });
  }

  command.on('error', function() {
    console.log('There was an error trying to run this command'.red);
    console.log('Please make sure you have node, npm, and grunt installed'.red);
    errorOutput = new Error( 'Error running command' )
  });

  command.on('close', function( exit ) {
    if ( errorOutput ) {
      return callback( errorOutput, output )
    }
    else if ( exit !== 0 ) {
      callback( exit, output )
    }
    else {
      callback( errorOutput, output )
    }
  });
}

function exitCodeIsNotError ( exitCode ) {
  return ( exitCode === null || exitCode === 0 )
}
