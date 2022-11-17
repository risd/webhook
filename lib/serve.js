'use strict';

const { spawn } = require('node:child_process')
const errors = require('./errors')

module.exports = async function Serve (options) {

  var args = [];

  if(options.port) {
    args.push('--port=' + options.port);
  }

  if(options.node) {
    args.push('--nodebin=' + options.node);
  }

  if(options.grunt) {
    args.push('--gruntbin=' + options.grunt);
  }

  if(options.npm) {
    args.push('--npmbin=' + options.npm);
  }

  if(options.cache) {
    args.push('--npmcache=' + options.cache);
  }

  if(options.token) {
    args.push('--token=' + options.token);
  }

  if(options.email) {
    args.push('--email=' + options.email.toLowerCase());
  }

  await runInDir(options.node || 'grunt', args, {
    cwd: options.cwd || '.',
    stdio: 'inherit',
  })
};

function runInDir(command, args, options) {
  return new Promise(() => {
    const cmd = spawn(command, args, options);

    cmd.on('error', function(error) {
      error.code = errors.ERROR_RUNNING_GRUNT_SERVE
      reject(error)
    })

    cmd.on('close', function() {
      resolve()
    })
  })
}
