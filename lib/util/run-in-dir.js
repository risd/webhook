var winSpawn = require('win-spawn');

module.exports = runInDir;

function runInDir(command, cwd, args, pipe, callback) {  

  if(typeof pipe === 'function') {
    callback = pipe;
    pipe = false;
  }

  var command = winSpawn(command, args, {
    stdio: [process.stdin, pipe ? 'pipe' : process.stdout, process.stderr],
    cwd: cwd
  });

  var output = '';

  if(pipe) {
    command.stdout.on('data', function (data) {
      output += data;
    });
  }

  command.on('error', function() {
    console.log('There was an error trying to run this command'.red);
    console.log('Please make sure you have node, npm, and grunt installed'.red);
  });

  command.on('close', function() {
    callback(output);
  });
}
