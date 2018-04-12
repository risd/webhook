module.exports = firebaseRetrieveSiteToken;

function firebaseRetrieveSiteToken ( firebaseRoot ) {

  return function firebaseRetrieveSiteTokenFn ( config, step ) {

    firebaseRoot.auth(config.firebaseToken, function(error, auth) {
      if(error) {
        process.exit(2);
      }
    
      var data = {};
      data[config.webhookEscapedUsername] = config.webhookUsername;

      firebaseRoot.child('sites/'+ config.siteName).once('value', function(data) {
        data = data.val();
        if(data.key) {
          config.siteToken = data.key
        }

        step();
      }, function(err) {
        if(err.code === 'PERMISSION_DENIED') // Either this doesn't exist yet or it does and we dont have access
        {
          console.log('This site does not exist or you do not have permissions'.red);
          process.exit(1);
        }
      });

    });
  }

}
