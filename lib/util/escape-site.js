module.exports = escapeSite;

function escapeSite ( site ) {
  return site.replace( /\./g, ',1' )
}