var runInDir = require( './run-in-dir' )

module.exports = runGruntInit;

function runGruntInit ( options, callback ) {
  var dirName = options.dirName || '.';

  var params = ['init', '--copycms=true', '--sitename=' + options.siteName, '--secretkey=' + options.siteToken];
  
  if(options.firebaseName) {
    params.push('--firebase=' + options.firebaseName);
  }

  if(options.server) {
    params.push('--server=' + options.server);
  }

  if (options.embedly) {
    params.push('--embedly=' + options.embedly);
  }

  if (options.imgix_host) {
    params.push('--imgix_host=' + options.imgix_host);
  }

  if (options.imgix_secret) {
    params.push('--imgix_secret=' + options.imgix_secret);
  }

  if (options.generate) {
    params.push('--generator_url=' + options.generate);
  }

  if(options.node && options.grunt) {
    params.unshift(options.grunt);
  }

  runInDir(options.node || 'grunt', dirName, params, callback );

}
