'use strict';

require('colors');

var fs = require( 'fs' )
var async = require( 'async' )

var Firebase = require( './util/firebase/index' )
var ensureSiteNameAndKeyExistStep = require( './util/ensure-site-name-and-key-exist' ).step

var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )
var GetSetDefault = require( './util/get-set-default' )

module.exports = function PresetBuild ( options, callback ) {
  if (typeof callback !== 'function') callback = exitCallback;

  var firebase = Firebase( options )

  var config = {
    firebaseName: options.firebaseName || 'webhook',
    siteName: null,
    siteKey: null,
    pathToWrite: options.toFile,
    all: options.all || true, // download all site data?, or just content type data
  }

  var configFn = functor( config )

  var dataToWrite = GetSetDefault( {} )

  async.series( [
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
    downloadDataStep
  ], callback )

  function downloadDataStep ( step ) {
    if ( config.all ) {
      var downloadTheData = firebase.siteDevData( config )
    }
    else {
      var downloadTheData = firebase.siteContentTypes( config )
    }

    if ( config.pathToWrite ) {
      console.log( 'Downloading Data'.green )
    }

    downloadTheData
      .then( writeSnapshotToFile )
      .catch( step )

    function writeSnapshotToFile ( dataSnapshot ) {
      dataToWrite( dataSnapshot.val() )
      if ( config.pathToWrite ) {
        console.log( 'Writing File'.green + ': ' + config.pathToWrite )
        return fs.writeFile( config.pathToWrite, JSON.stringify( dataToWrite(), null, 2 ), step )
      }
      step()
    }
  }
}
