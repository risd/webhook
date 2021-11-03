const fs = require( 'fs' )

module.exports = PackageUpdate

// store package.json
// add another, update dependencies of the original one
// write out package.json
function PackageUpdate ( platformName, packagePath ) {
  var packageObj = readJson( packagePath )

  if ( ! packageObj[ platformName ] ) packageObj[ platformName ] = {}
  if ( ! packageObj.devDependencies ) packageObj.devDependencies = {}
  if ( ! packageObj.dependencies ) packageObj.dependencies = {}
  if ( ! packageObj.scripts ) packageObj.scripts = {}

  return {
    with: updateWith,
    write: writeFile
  }

  function updateWith ( updatePackagePath ) {
    var updatePackage = readJson( updatePackagePath )
    Object.assign( packageObj[ platformName ], updatePackage[ platformName ] || {} )
    Object.assign( packageObj.devDependencies, updatePackage.devDependencies || {} )
    Object.assign( packageObj.dependencies, updatePackage.dependencies )
    Object.assign( packageObj.scripts, updatePackage.scripts )
  }

  function writeFile ( writeToPath ) {
    if ( ! writeToPath ) return packageObj
    fs.writeFileSync( writeToPath, JSON.stringify( packageObj, null, "  " ) )
  }

  function readJson ( filePath ) {
    if ( typeof filePath === 'object' && filePath !== null ) return filePath;
    return JSON.parse( fs.readFileSync( filePath ) )
  }
}
