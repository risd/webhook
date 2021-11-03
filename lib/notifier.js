'use strict';

require('colors');

var exitCallback = require( './util/exit-callback' )

module.exports = function Notifier (version, callback) {
  if (typeof callback !== 'function') callback = exitCallback;

  var notSupportedMessage = `
    Notifier is currently deprecated.
    Notifier was used under webhook/wh, although the open
    source implementation of webhook/webhook-server-open did
    not include security rules that allowed for this.
    Not sure its worth implementing, since there is a relationship
    between this tool & webhook-generate.
    For now, the @risd forks of these repositories will not support
    the Notifier.
  `
  console.log( notSupportedMessage )
  return callback( new Error( notSupportedMessage ) )
};
