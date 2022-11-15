module.exports = async function Delete (options) {

  var notSupportedMessage = `
    Delete is not currently supported from the CLI.
    @risd/webhook-server-open has a \`delete-site\` command
    in \`/home/webhook/webhook-server-open/bin/delete-site\`
    where sites can be deleted from.
  `
  const error = new Error(notSupportedMessage)
  throw error
};
