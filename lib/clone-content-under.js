'use strict';

require('colors');

var async = require('async');
var firebase = require('firebase');

var ensureSiteNameAndKeyExist = require( './util/ensure-site-name-and-key-exist' )
var authenticateFirebaseInstance = require( './util/authenticate-firebase-instance' )
var uniqueId = require( './util/unique-id' )
var signalSiteReindex = require( './util/signal-site-reindex' )

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
    ensureSiteNameAndKeyExist( config ),
    authenticateFirebaseInstance( { config: config, firebase: firebaseRoot } ),
    cloneContent,
    signalSiteSearchReindex,
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

      var combinedContentTypeData = combineContentTypeData( contentTypeData, clonedContentTypeData )

      // uses combinedContentTypeData.contentType
      var contentTypeSettingTask = function ( contentTypeStep ) {
        console.log('Cloning contentTypes'.green);
        siteDataRef.child( 'contentType' ).set( combinedContentTypeData.contentType, contentTypeStep )
      }

      var dataSettingTasks = Object.keys( clonedContentTypeData ).map( function ( clonedContentTypeDataName ) {
          
        var clonedFromContentType = clonedContentTypeData[ clonedContentTypeDataName ].clonedFrom;
        
        return function setDataTask ( dataStep ) {
          siteDataRef.child( 'data' ).child( clonedFromContentType ).once( 'value', function ( snapshotToClone ) {
            var dataToClone = snapshotToClone.val();

            console.log('Cloning data '.green + clonedContentTypeDataName.green );

            siteDataRef.child( 'data' ).child( clonedContentTypeDataName ).set( dataToClone, dataStep )
          }, dataStep )
        }

      } )

      var updateReverseRelationshipDataTasks = createUpdateReverseRelationshipDataTasks( combinedContentTypeData.createReverseDataArguments )

      var combinedTasks = [].concat( [ contentTypeSettingTask ], dataSettingTasks, updateReverseRelationshipDataTasks )

      async.parallelLimit( combinedTasks, 5, function onComplete ( error ) {
        if ( error ) return step( error )
        else return step()
      } )

    }, step)

    /**
     * Task to update reverse related data to include new cloned relationships
     * 
     * @param  {object}   createReverseDatumArguments.{contentType}[]
     * @param  {bool}     createReverseDatumArguments.{contentType}[].isOneOff
     * @param  {object}   createReverseDatumArguments.{contentType}[].controlToClone
     * @param  {string}   createReverseDatumArguments.{contentType}[].cloneControlWithName
     * @param  {string}   createReverseDatumArguments.{contentType}[].cloneControlValueWithContentType
     * 
     * @return {Function} task
     */
    function createUpdateReverseRelationshipDataTasks ( createReverseDataArguments ) {

      var tasks = Object.keys( createReverseDataArguments ).map( function ( contentType ) {
        
        var updateReverseDataArguments = createReverseDataArguments[ contentType ];

        return function setReverseData ( reverseStep ) {

          var reverseDataRef = siteDataRef.child( 'data' ).child( contentType )

          // get value
          reverseDataRef.once( 'value', function ( reverseDataSnapshot ) {
            var reverseData = reverseDataSnapshot.val();
            
            // update value
            if ( updateReverseDataArguments.isOneOff ) var updateReverseDataFunction = updateIndividual;
            else  var updateReverseDataFunction = updateMultiple;

            var updatedReverseData = updateReverseDataFunction( reverseData, updateReverseDataArguments )

            // set value
            reverseDataRef.set( updatedReverseData, reverseStep )

          } )
        }
      } )

      return tasks;

      function updateIndividual ( reverseData, updateControlsArguments ) {

        updateControlsArguments
          .filter( function ensureDataToClone ( updateControlArguments ) { return Array.isArray( reverseData[ updateControlArguments.controlToClone ] ) } )
          .forEach( function cloneData ( updateControlArguments ) {
            var clonedReverseControlData = reverseData[ updateControlArguments.controlToClone ].map( function ( relationshipValue ) {
              var relationshipValueKey = relationshipValue.split( ' ' )[ 1 ]
              return [ updateControlArguments.cloneControlValueWithContentType, relationshipValueKey ].join( ' ' )
            } )
            reverseData[ updateControlArguments.cloneControlWithName ] = clonedReverseControlData;
          } )

        return reverseData;
      }

      function updateMultiple ( reverseData, updateControlsArguments ) {

        try {
          Object.keys( reverseData ).forEach( function ( reverseDataKey ) {
            reverseData[ reverseDataKey ] = updateIndividual( reverseData[ reverseDataKey ], updateControlsArguments )
          } )
        } catch( error ) {
          // no reverse data entries, lets just return what we got
        }

        return reverseData;
      }
    }

    /**
     * Combine the existing content type data with the cloned content type data.
     * Create an object to be used as arguments for updating reverse relationship data.
     * 
     * @param  {object} contentTypeData       Current content type data
     * @param  {object} clonedContentTypeData Cloned content type data
     * @return {object} combined
     * @return {object} combined.contentType
     * @return {object} combined.createReverseDataArguments
     */
    function combineContentTypeData ( contentTypeData, clonedContentTypeData ) {

      var createReverseDataArguments = {};

      Object.keys( clonedContentTypeData ).forEach( function ( clonedContentTypeKey ) {
        
        clonedContentTypeData[ clonedContentTypeKey ].controls
          .filter( function ( clonedContentTypeControl ) { return clonedContentTypeControl.controlType === 'relation'; } )
          .forEach( function ( clonedContentTypeControl ) {
          
            var reverseContentTypeKey = clonedContentTypeControl.meta.contentTypeId;
            var reverseName = clonedContentTypeControl.meta.reverseName;
            var clonedReverseName = [ config.cloneNamespace.toLowerCase(), reverseName ].join('');
            clonedContentTypeControl.meta.reverseName = clonedReverseName;

            Object.keys( contentTypeData )
              .filter( function ( contentTypeDataKey ) { return contentTypeDataKey === reverseContentTypeKey; } )
              .forEach( function ( contentTypeDataKey ) {

                var reverseControl = findReverseControl();
                if ( reverseControl === null ) return;

                var clonedReverseControl = Object.assign( {}, reverseControl, {
                  label: [
                    clonedContentTypeData[ clonedContentTypeKey ].name,
                    ' (', contentTypeDataKey, ')' ].join( '' ),
                  name: clonedReverseName,
                  meta: {
                    contentTypeId: clonedContentTypeKey,
                    reverseName: clonedContentTypeControl.name,
                  }
                } )

                contentTypeData[ contentTypeDataKey ].controls.push( clonedReverseControl )

                var createReverseDatumArguments = {
                  isOneOff: contentTypeData[ contentTypeDataKey ].oneOff,
                  controlToClone: [ reverseControl.name ],     // key to duplicate
                  cloneControlWithName: clonedReverseName, // name to set for the new data key
                  cloneControlValueWithContentType: clonedContentTypeKey, // content type name to swap into relationship array
                }

                if ( ! createReverseDataArguments.hasOwnProperty( contentTypeDataKey ) ) {
                  createReverseDataArguments[ contentTypeDataKey ] = [];
                }
                
                createReverseDataArguments[ contentTypeDataKey ].push( createReverseDatumArguments )

                function findReverseControl () {
                  var reverseControl = null;

                  var matchingControls = contentTypeData[ contentTypeDataKey ].controls
                    .filter( function ( contentTypeControl ) {
                      return contentTypeControl.name === reverseName;
                    } )

                  if ( matchingControls.length === 1 ) {
                    reverseControl = matchingControls[ 0 ];
                  }

                  return reverseControl
                }
              
              } )
        } )
      } )

      return {
        contentType: Object.assign( contentTypeData, clonedContentTypeData ),
        createReverseDataArguments: createReverseDataArguments,
      };
    }

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

  function signalSiteSearchReindex ( step ) {

    var indexData = {
      userid: config.userid || 'CLI',
      sitename: config.sitename,
      id: uniqueId(),
    }

    signalSiteReindex( { indexData: indexData, firebaseRoot: firebaseRoot }, step )
  }

}