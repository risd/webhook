var inquirer = require( 'inquirer' )

module.exports = getUserLoginInformation;
module.exports.step = getUserLoginInformationStep;


function getUserLoginInformation( service, callback ) {
  var username = '';
  var password = '';

  inquirer.prompt({
    type: 'input',
    name: 'username',
    message: 'Enter your ' + service + ' email:',
  }, function (answer) {
    username = answer.username;

    function promptPassword(cb) {
      inquirer.prompt({
        type: 'password',
        name: 'password',
        message: 'Enter your ' + service +' password:',
      }, function (answer) {
        password = answer.password;
        if(password.trim() === '') {
          console.log('\n========================================================'.red);
          console.log('# No password entered, please re-enter                 #'.red);
          console.log('========================================================'.red);
          promptPassword(cb);
        } else {
          cb(password);
        }
      }); 
    }

    promptPassword(function(password) {
      callback(username, password)
    });
  });
}

function getUserLoginInformationStep ( configFn, step ) {
  var config = configFn()
  if ( config.firebase.currentUser() ) {
    return step()
  }

  getUserLoginInformation( config.platformName, function(username, password) {
    config.webhookUsername = username.toLowerCase();
    config.webhookEscapedUsername = username.toLowerCase().replace(/\./g, ',1');
    config.webhookPassword = password;
    step()
  })
}
