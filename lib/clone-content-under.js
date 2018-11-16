'use strict';

require('colors');

var async = require('async');

var Firebase = require( './util/firebase/index' )
var firebaseTokenAuthStep = require( './util/firebase/token-auth' ).step
var ensureSiteNameAndKeyExistStep = require( './util/ensure-site-name-and-key-exist' ).step
var getUserLoginInformationStep = require( './util/get-user-login-information' ).step
var firebaseLoginUserStep = require( './util/firebase/login-user' ).step
var signalSiteReindexStep = require( './util/signal-site-reindex' ).step

var functor = require( './util/functor' )
var exitCallback = require( './util/exit-callback' )

module.exports = CloneContentUnder;

function CloneContentUnder ( options, callback ) {
  if (typeof callback !== 'function') callback = exitCallback;
  if (typeof options !== 'object') options = {};

  return callback( new Error( 'Currently not implemented.' ) )

  var firebase = Firebase( options )

  // Set of basic configuration for this (Defaults)
  var config = {
    firebaseName: options.firebaseName || 'webhook',
    firebaseAPIKey: options.firebaseAPIKey,
    firebaseToken: options.firebaseToken,
    firebase: firebase,
    cloneNamespace: options.namespace,
    cloneContentTypes: options.contentTypes || [],

    siteName: null,
    siteKey: null,
    
    webhookUsername: options.email ? options.email.toLowerCase() : '',
    webhookEscapedUsername: '',
    webhookPassword: options.password,
    platformName: options.platformName || 'webhook',
  }

  var configFn = functor( config )

  if ( ! config.cloneNamespace ) {
    return callback( new Error( 'Requires a `namespace` value to use for prefixing cloned content types.' ) )
  }

  if ( Array.isArray( config.cloneContentTypes ) ) {
    config.cloneContentTypes = config.cloneContentTypes.map( function ( type ) { return type.toLowerCase(); } )
  }

  var series = [
    ensureSiteNameAndKeyExistStep.bind( null, configFn ),
    firebaseTokenAuthStep.bind( null, configFn ),
    getUserLoginInformationStep.bind( null, configFn ),
    firebaseLoginUserStep.bind( null, configFn ),
    cloneContent,
    signalSiteReindexStep.bind( null, configFn ),
  ]
  
  return async.series( series, function onComplete ( error ) {
     if ( error ) return callback( error )
     else return callback()
  } )

  function cloneContent ( step ) {

    var siteKeyOptions = {
      siteName: config.siteName,
      siteKey: config.siteKey,
    }

    firebase.siteContentTypes( siteKeyOptions )
      .then( handleContentTypeSnapshot )
      .catch( step )

    function handleContentTypeSnapshot ( contentTypeSnapshot ) {
      
      var contentTypeData = contentTypeSnapshot.val()

      var contentTypeDataToClone = ( config.cloneContentTypes.length === 0 )
        ? Object.assign( {}, contentTypeData )
        : matchingContentTypes( contentTypeData )

      var clonedContentTypeData = cloneContentTypes( contentTypeDataToClone )

      var combinedContentTypeData = combineContentTypeData( contentTypeData, clonedContentTypeData )

      // uses combinedContentTypeData.contentType
      var contentTypeSettingTask = function ( contentTypeStep ) {
        console.log('Cloning contentTypes'.green);
        firebase.siteContentTypes( config, combinedContentTypeData.contentType )
          .then( contentTypeStep )
          .catch( contentTypeStep )
      }

      var dataSettingTasks = Object.keys( clonedContentTypeData ).map( function ( clonedContentTypeDataName ) {
          
        var clonedFromContentType = clonedContentTypeData[ clonedContentTypeDataName ].clonedFrom;
        
        return function setDataTask ( dataStep ) {
          var siteDataToCloneOptions = Object.assign( {
            contentType: clonedFromContentType,
          }, siteKeyOptions )
          firebase.siteData( siteDataToCloneOptions )
            .then( handleSnapshotToClone )
            .then( dataStep )
            .catch( dataStep )

          function handleSnapshotToClone ( snapshotToClone ) {
            var dataToClone = snapshotToClone.val()

            console.log('Cloning data '.green + clonedContentTypeDataName.green )

            var siteDataClonedOptions = Object.assign( {
              contentType: clonedContentTypeDataName,
            }, siteKeyOptions )
            return firebase.siteData( siteDataClonedOptions, dataToClone )
          }
        }

      } )

      var updateReverseRelationshipDataTasks = createUpdateReverseRelationshipDataTasks( combinedContentTypeData.createReverseDataArguments )

      var combinedTasks = [].concat( [ contentTypeSettingTask ], dataSettingTasks, updateReverseRelationshipDataTasks )
      // var combinedTasks = []

      async.parallelLimit( combinedTasks, 5, function onComplete ( error ) {
        if ( error ) return step( error )
        else return step()
      } )

    }

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

          var reverseDataOptions = Object.assign( {
            contentType: contentType,
          }, siteKeyOptions )

          firebase.siteData( reverseDataOptions )
            .then( handleReverseDataSnapsot )
            .then( reverseStep )
            .catch( reverseStep )

          function handleReverseDataSnapsot ( reverseDataSnapshot ) {
            var reverseData = reverseDataSnapshot.val()

            // update value
            if ( updateReverseDataArguments.isOneOff ) var updateReverseDataFunction = updateIndividual;
            else  var updateReverseDataFunction = updateMultiple;

            var updatedReverseData = updateReverseDataFunction( reverseData, updateReverseDataArguments )

            return firebase.siteData( reverseDataOptions, updatedReverseData )
          }
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
            
            var clonedContentTypeName = clonedContentTypeData[ clonedContentTypeKey ].name
            var clonedFrom = clonedContentTypeData[ clonedContentTypeKey ].clonedFrom

            var reverseContentTypeKey = clonedContentTypeControl.meta.contentTypeId;
            var reverseName = clonedContentTypeControl.meta.reverseName;
            var clonedReverseName = [ config.cloneNamespace.toLowerCase(), reverseName ].join('_');

            // update the existing control
            clonedContentTypeControl.meta.reverseName = clonedReverseName;
            clonedContentTypeControl.name = makeControlName( clonedContentTypeControl.name, '_' )
            clonedContentTypeControl.label = makeControlName( clonedContentTypeControl.label, ' ' )

            Object.keys( contentTypeData )
              .filter( function ( contentTypeDataKey ) { return contentTypeDataKey === reverseContentTypeKey; } )
              .forEach( function ( contentTypeDataKey ) {

                var reverseControl = findReverseControl();
                if ( reverseControl === null ) return;

                // add the new reverse control
                var clonedReverseControl = Object.assign( {}, reverseControl, {
                  label: [ clonedContentTypeName, ' (', contentTypeDataKey, ')' ].join( '' ),
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
                  cloneControlWithName: clonedReverseName,     // name to set for the new data key
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
        
            function makeControlName ( controlName, seperator ) {
              var nameIndex = controlName.toLowerCase().indexOf( clonedFrom.toLowerCase() )
              if ( nameIndex === -1 ) {
                return [ clonedContentTypeControl.name, config.cloneNamespace.toLowerCase() ].join( seperator )
              }
              return [
                controlName.slice( 0, nameIndex ) + config.cloneNamespace.toLowerCase(),
                controlName.slice( nameIndex ),
             ].join( seperator )
            }
        } )
      } )

      return {
        contentType: Object.assign( {}, contentTypeData, clonedContentTypeData ),
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

}