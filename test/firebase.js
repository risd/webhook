const test = require( 'tape' )
const FirebaseInterface = require( '../lib/util/firebase/index.js' )
const env = require( './env.js' )()

const firebaseInterface = FirebaseInterface( env.firebaseInterface )

test.onFinish( function () {
  // FirebaseInterface will hang the process indefinitely, so we
  // have to manually close it out.
  process.exit()
} )

test( 'database', function ( t ) {
  t.plan( 1 )

  t.ok( firebaseInterface.database(), 'got database reference')
} )

test( 'login:wrong-password', function ( t ) {
  t.plan( 1 )

  firebaseInterface.login( {
    email: env.webhook.username,
    password: 'wrong-password'
  } )
    .then( function ( user ) {
      t.notOk( user, 'should not have finished ok' )
    } )
    .catch( function ( error ) {
      t.ok( error.code === 'auth/wrong-password', 'finished with correct error' )
    } )
} )

test( 'login:successfully', function ( t ) {
  t.plan( 1 )

  firebaseInterface.login( {
    email: env.webhook.username,
    password: env.webhook.password,
  } )
    .then( function ( user ) {
      t.ok( user, 'finished successfully' )
    } )
    .catch( function ( error ) {
      t.notOk( error, 'finished with error' )
    } )
} )

test( 'site-data:get-set', function ( t ) {
  t.plan( 5 )

  const setTimeStamp = new Date().toString()

  // get site data
  firebaseInterface.siteData( env.siteNameKey )
    .then( function ( snapshot ) {
      var data = snapshot.val()
      t.ok( typeof data === 'object', 'got data object for site name and key')
      setData( data )
    } )
    .catch( function ( error ) {
      t.notOk( error, 'failed to get site data for name and key' )
      t.end( new Error( 'must get data to be able to set it' ) )
    } )

  function setData ( data ) {
    data._webhook_test_suite_set_data_sdk = setTimeStamp

    firebaseInterface.siteData( env.siteNameKey, data )
      .then( function ( result ) {
        t.ok( true, 'set data successfully' )
      } )
      .catch( function ( error ) {
        t.notOk( error, 'set data failed' )
      } )
      .finally( function () {
        setDataForceREST( data )
      } )
  }

  function setDataForceREST ( data ) {
    data._webhook_test_suite_set_data_rest = setTimeStamp

    var options = Object.assign( {
      forceREST: true,
    }, env.siteNameKey )

    firebaseInterface.siteData( options, data )
      .then( function ( result ) {
        t.ok( true, 'set data successfully via forced rest' )
      } )
      .catch( function ( error ) {
        t.notOk( error, 'set data failed via forced rest' )
      } )
      .finally( function () {
        verifySet()
      } )
  }

  function verifySet () {
    firebaseInterface.siteData( env.siteNameKey )
      .then( function ( snapshot ) {
        var data = snapshot.val()
        t.ok( data._webhook_test_suite_set_data_sdk === setTimeStamp, 'verified set via sdk' )
        t.ok( data._webhook_test_suite_set_data_rest === setTimeStamp, 'verified set via rest' )
      } )
      .catch( function ( error ) {
        t.notOk( error, 'failed to get site data for name and key to verify set methods' )
        t.end( new Error( 'must get data to be able to set it' ) )
      } )
  }
} )
