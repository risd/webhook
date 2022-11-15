var runInDir = require( './run-in-dir' )

module.exports = runNpmInstall;

function runNpmInstall (options={}) {
  const cmdOptions = {
    cwd: options.dirName || '.'
  }

  return runInDir(options.npm || 'npm', ['install'], cmdOptions)
}
