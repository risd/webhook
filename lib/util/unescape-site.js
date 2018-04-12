module.exports = unescapeSite;

function unescapeSite ( site ) {
  return site.replace( /,1/g, '.' )
}