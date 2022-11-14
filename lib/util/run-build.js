const debug = require('debug')('run-build')
const runInDir = require('./run-in-dir')
const { ERROR_IN_SITE_BUILD } = require('../errors.js')

module.exports = runBuild;

async function runBuild ({ args=['--noWatch', '--strict=true'] }) {
  try {
    await runInDir('grunt', args)
    return true
  }
  catch (error) {
    debug(error)
    error.message = ERROR_IN_SITE_BUILD
    throw error
  }
}
