module.exports = exit;

function exit ( error ) {
  return error
    ? (function () { console.log( error.message.red ); process.exit(1) }())
    : process.exit(0);
}
