'use strict';

var async = require('async');

require('colors');

var util = require('./util.js');
var firebase = require('firebase');

function exit ( error ) {
  return error
    ? (function () { console.log( error.message.red ); process.exit(1) }())
    : process.exit(0);
}

module.exports = CloneContentUnder;

function CloneContentUnder ( options, callback ) {
  if (typeof callback !== 'function') callback = exit;
  if (typeof options !== 'object') options = {};

  // Set of basic configuration for this (Defaults)
  var config = {
    firebaseName: options.firebaseName || 'webhook',
    firebaseToken: options.firebaseToken || '',
    cloneNamespace: options.namespace || 'V2',
    cloneContentTypes: options.contentTypes || [],

    sitename: null,
    sitekey: null,
    
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: '',
  };

  if ( Array.isArray( config.cloneContentTypes ) ) {
    config.cloneContentTypes = config.cloneContentTypes.map( function ( type ) { return type.toLowerCase(); } )
  }

  var firebaseRoot = null;

  firebaseRoot = new firebase('https://' + config.firebaseName + '.firebaseio.com');

  var series = [
    util.ensureSiteNameAndKeyExist( config ),
    util.authenticateFirebaseInstance( { config: config, firebase: firebaseRoot } ),
    cloneContent
  ]
  
  return async.series( series, function onComplete ( error ) {
     if ( error ) return callback( error )
     else return callback()
  } )

  function cloneContent ( step ) {
    
    var siteDataRef = firebaseRoot.child('buckets').child(config.sitename).child(config.sitekey).child('dev');
    
    siteDataRef.child('contentType').once('value', function ( contentTypeSnapshot ) {
      
      var contentTypeData = contentTypeSnapshot.val()

      var contentTypeDataToClone = (config.cloneContentTypes.length === 0
        ? contentTypeData
        : matchingContentTypes( contentTypeData ) )

      var clonedContentTypeData = cloneContentTypes( contentTypeDataToClone )

      var combinedContentTypeData = Object.assign( contentTypeData, clonedContentTypeData )

      var contentTypeSettingTask = function ( contentTypeStep ) {
        console.log('Cloning contentTypes'.green);
        siteDataRef.child( 'contentType' ).set( combinedContentTypeData, contentTypeStep )
      }

      var dataSettingTasks = Object.keys( clonedContentTypeData )
        .map( function ( clonedContentTypeDataName ) {
          
          var clonedFromContentType = clonedContentTypeData[ clonedContentTypeDataName ].clonedFrom;
          
          return function setDataTask ( dataStep ) {
            siteDataRef.child( 'data' ).child( clonedFromContentType ).once( 'value', function ( snapshotToClone ) {
              var dataToClone = snapshotToClone.val();

              console.log('Cloning data '.green + clonedContentTypeDataName.green );

              siteDataRef.child( 'data' ).child( clonedContentTypeDataName ).set( dataToClone, dataStep )
            }, dataStep )
          }

        } )

      var combinedTasks = dataSettingTasks.concat( [ contentTypeSettingTask ] )

      async.parallelLimit( combinedTasks, 5, function onComplete ( error ) {
        if ( error ) return step( error )
        else return step()
      } )

    }, step)

    function matchingContentTypes ( contentTypeData ) {
      var matching = {};

      Object.keys( contentTypeData )
        .forEach( function ( contentTypeName ) {
          
          if ( config.cloneContentTypes.indexOf( contentTypeName ) > -1 ) {
            matching[ contentTypeName ] = Object.assign( {}, contentTypeData[ contentTypeName ] )
          }
          
        } )

      return matching;
    }

    function cloneContentTypes ( contentTypeData ) {
      var cloned = {};

      Object.keys( contentTypeData )
        .forEach( function ( contentTypeName ) {
          var clonedContentTypeKey = [ config.cloneNamespace.toLowerCase(), contentTypeName ].join( '' );
          var clonedContentTypeName = [ config.cloneNamespace, contentTypeData[ contentTypeName ].name ].join( ' ' );
          
          var clonedContentTypeData = Object.assign( {}, contentTypeData[ contentTypeName ] );
          clonedContentTypeData.name = clonedContentTypeName;
          clonedContentTypeData.clonedFrom = contentTypeName;

          cloned[ clonedContentTypeKey ] = clonedContentTypeData;

        } );

      return cloned;
    }

  }

}