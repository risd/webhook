var inquirer = require( 'inquirer' )
var escape = require( './escape-site' )

module.exports = getUserLoginInformation;


function getUserLoginInformation() {
  var username = '';
  var password = '';

  return new Promise((resolve, reject) => {
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
          } )
          .then(function (answer) {
            password = answer.password;
            if(password.trim() === '') {
              console.log('\n========================================================'.red);
              console.log('# No password entered, please re-enter                 #'.red);
              console.log('========================================================'.red);
              promptPassword(cb);
            } else {
              cb(password);
            }
          } ) 
      }

      promptPassword(function(password) {
        resolve({ username, password })
      })
    })
  })
}
