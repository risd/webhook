const test = require( 'tape' )

test( 'cli & lib', function ( t ) {
  t.plan( 2 )
  const wh = require( '../index.js' )
  t.assert( typeof wh === 'function', 'imported wh cli' )
  t.assert( typeof wh.lib === 'object', 'imported node interface' )
} )
