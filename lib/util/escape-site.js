module.exports = escapeSite;

function escapeSite ( site ) {
  return site.toLowerCase().replace( /\./g, ',1' )
}
