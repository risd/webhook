'use strict';

require('colors');

var exitCallback = require( './util/exit-callback' )

module.exports = function Delete (options, callback) {
  if (typeof callback !== 'function') callback = exitCallback;

  var notSupportedMessage = `
    Delete is not currently supported from the CLI.
    @risd/webhook-server-open has a \`delete-site\` command
    in \`/home/webhook/webhook-server-open/bin/delete-site\`
    where sites can be deleted from.
  `
  return callback( new Error( notSupportedMessage ) )
};
