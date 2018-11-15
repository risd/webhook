module.exports = GetSetDefault;

function GetSetDefault ( defaultValue ) {
  var value = defaultValue;
  return function ( x ) {
    if ( ! arguments.length ) return value;
    value = x;
  }
}
