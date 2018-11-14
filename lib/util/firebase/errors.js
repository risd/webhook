module.exports.authWrongPassword = AuthWrongPassword;

function AuthWrongPassword () {
  console.log('\n========================================================'.red);
  console.log('# Password is incorrect                                #'.red);
  console.log('========================================================'.red);
  console.log('# Please doublecheck your records. You can change your password at:.'.red);
  console.log('# http://www.webhook.com/secret/password-reset/'.yellow);
  console.log('# ---------------------------------------------------- #'.red);
}
