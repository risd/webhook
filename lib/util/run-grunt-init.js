var runInDir = require('./run-in-dir')

module.exports = runGruntInit;

function runGruntInit (options={ cwd: '.' }) {
  const cwd = options.cwd || process.cwd()

  var args = ['init'];

  if (!options.hasOwnProperty('copycms')) options.copycms = true

  Object.keys (options).forEach(function (optionKey) {
    var optionValue = options[ optionKey ];
    if ( typeof optionValue === 'string' ||
         typeof optionValue === 'boolean' ||
         typeof optionValue === 'number' ) {
      args = args.concat([ `--${ optionKey }=${ optionValue }` ])
    }
    else if (typeof optionValue === 'object' &&
              optionValue !== null &&
              optionValue.hasOwnProperty( 'gruntInitParameter' )) {
      args = args.concat([ `--${ optionKey }=${ optionValue.gruntInitParameter }` ])
    }
  })

  runInDir('grunt', args, { cwd });
}
