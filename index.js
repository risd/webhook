'use strict';

require('colors');
var program = require('commander');

var version = 'v24';

module.exports = function (argv) {
  require('./lib/notifier.js')(version, function() {
    program
      .version(require('./package.json').version)
      .option('-f, --firebase [firebasename]', 'Use the specified firebase instead of webhook main, for self hosting mode')
      .option('-s, --server [uploadserver]', 'Use this server when uploading files, for self hosting mode')
      .option('-m, --embedly [embedly]', 'Use this embedly key when writing .firebase.conf, for self hosting mode')
      .option('-b, --generate [generate]', 'Use this generator URL when creating a new site, for self hosting mode')
      .option('-h, --imgix_host [imgixhost]', 'Use this URL for imgix CDN serving, for self hosting mode')
      .option('-x, --imgix_secret [imgixsecret]', 'Use this secret to sign imgix URLs, for self hosting mode')
      .option('-n, --npm [npmPath]', 'Use this npm executable over the default one (npm)')
      .option('-o, --node [nodePath]', 'Use this node executable over the default one (node)')
      .option('-g, --grunt [gruntPath]', 'Use this grunt executable over the default one (grunt)')
      .option('-t, --token [authToken]', 'Use this auth token for firebase instead of prompting for login')
      .option('-f, --force [force]', 'If true, will force update')
      .option('-c, --cache [cacheDir]', 'Sets the directory to use for npm cache')
      .option('-e, --email [email]', 'The e-mail address to use when using the --token option');

    program
      .command('create <siteName>')
      .description('Create a new webhook site')
      .action(function (siteName) {
        var siteName = siteName.toLowerCase();

        if(program.firebase) {
          siteName = siteName.replace(/\./g, ',1');
        }

        require('./lib/create.js')({
          siteName: siteName,
          firebase: program.firebase,
          embedly: program.embedly,
          server: program.server,
          generate: program.generate,
          imgix_host: program.imgix_host,
          imgix_secret: program.imgix_secret,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          force: program.force,
          cache: program.cache
        });
      });

    program
      .command('delete <siteName>')
      .description('Delete a site from webhook')
      .action(function (siteName) {
        var siteName = siteName.toLowerCase();

        if(program.firebase) {
          siteName = siteName.replace(/\./g, ',1');
        }

        require('./lib/delete.js')({
          siteName: siteName,
          firebase: program.firebase,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          force: program.force
        });
      });

    program
      .command('init <siteName>')
      .description('Initializes a site with configuration files')
      .action(function (siteName) {
        var siteName = siteName.toLowerCase();

        if(program.firebase) {
          siteName = siteName.replace(/\./g, ',1');
        }
        
        require('./lib/init.js')({
          siteName: siteName,
          firebase: program.firebase,
          server: program.server,
          embedly: program.embedly,
          generate: program.generate,
          imgix_host: program.imgix_host,
          imgix_secret: program.imgix_secret,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          cache: program.cache
        });
      });

    program
      .command('recreate <siteName>')
      .description('Recreates a site using the last version of the site uploaded to the webhook servers.')
      .action(function (siteName) {
        var siteName = siteName.toLowerCase();

        if(program.firebase) {
          siteName = siteName.replace(/\./g, ',1');
        }
        
        require('./lib/recreate.js')({
          siteName: siteName,
          firebase: program.firebase,
          server: program.server,
          embedly: program.embedly,
          generate: program.generate,
          imgix_host: program.imgix_host,
          imgix_secret: program.imgix_secret,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          cache: program.cache
        });
      });

    program
      .command('list-sites')
      .description('Lists all the sites that the user is an owner/user on')
      .action(function () {
        require('./lib/list-sites.js')({
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email
        });
      });

    program
      .command('preset-build')
      .description('Generates a .preset-data.json file from a webhook directory')
      .action(function () {
        require('./lib/preset-build.js')(false, {
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          toFile: null  // use the default
        });
      });

    program
      .command('preset-build-all')
      .description('Generates a .preset-data.json file from a webhook directory which includes data')
      .action(function () {
        require('./lib/preset-build.js')(true, {
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          toFile: null  // use the default
        });
      });

    program
      .command('backup [toFile]')
      .description('Generates a backup JSON file at the <toFile> from a webhook directory which includes data')
      .action(function (toFile) {
        require('./lib/preset-build.js')(true, {
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          toFile: toFile
        });
      });

    program
      .command('restore <fromFile>')
      .description('Restores database to state captured in backup file, such as one generated from `wh backup`')
      .action(function (fromFile) {
        require('./lib/restore.js')(true, {
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          fromFile: fromFile
        });
      });

    program
      .command('update')
      .description('Updates a webhook site with the latest generate code')
      .action(function () {
        require('./lib/update.js')({
          firebase: program.firebase,
          server: program.server,
          embedly: program.embedly,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          force: program.force,
          cache: program.cache
        });
      });

    program
      .command('push')
      .description('Push webhook directory to server')
      .action(function () {
        require('./lib/push.js')({
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email
        });
      });
      
    program
      .command('deploy')
      .description('Push webhook directory to server')
      .action(function () {
        require('./lib/push.js')({
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email
        });
      });

    program
      .command('serve [port]')
      .description('Serves a webhook site locally')
      .action(function (port) {
        require('./lib/serve.js')({
          port: port || null,
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          cache: program.cache
        });
      });

    program
      .command('echo-options')
      .description('Echos options passed into this command, used for debugging')
      .action(function() {
        console.log(program.firebase);
        console.log(program.server);
        console.log(program.embedly);
        console.log(program.generate);
        console.log(program.imgix_host);
        console.log(program.imgix_secret);
        console.log(program.npm);
        console.log(program.node);
        console.log(program.grunt);
        console.log(program.token);
        console.log(program.email);
      });
    
    program
      .parse(argv);

    if (!program.args.length) program.help();
  });
};

module.exports.version = version;