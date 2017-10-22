'use strict';

require('colors');
var program = require('commander');

var version = 'v24';

module.exports = function (argv) {
  require('./lib/notifier.js')(version, function() {
    
    program.version(require('./package.json').version)
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
      .option('-e, --email [email]', 'The e-mail address to use when using the --token option')
      .option('--types [contentTypes]', 'Clone these content types. If omitted, all content types are cloned.')
      .option('--skipBuild', 'Skips the site build as a step to ensure templates are okay before deploying.')
      .option('--gcloud [gcloud]', 'Path to Google Project JSON file.')
      .option('--staticFolder [staticFolder]', 'Path to local folder to push folder.')
      .option('--staticPrefix [staticPrefix]', 'Prefix to add to the static directory being pushed.')
      .option('--gitBranch [gitBranch]', 'Git branch to use, instead of the current branch.')

    program.command('create <siteName>')
      .description('Create a new webhook site')
      .action(function (siteName) {
        if ( Array.isArray( siteName ) )
          siteName = siteName[0]

        try {
          siteName = siteName.toLowerCase();  
        } catch (error) {
          throw new Error(
            'siteName: ' + siteName + '\n' +
            'Requires a valid site name.' )
        }
        

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

    program.command('delete <siteName>')
      .description('Delete a site from webhook')
      .action(function (siteName) {
        if ( Array.isArray( siteName ) )
          siteName = siteName[0]

        try {
          siteName = siteName.toLowerCase();  
        } catch (error) {
          throw new Error(
            'siteName: ' + siteName + '\n' +
            'Requires a valid site name.' )
        }

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

    program.command('init <siteName>')
      .description('Initializes a site with configuration files')
      .action(function (siteName) {
        if ( Array.isArray( siteName ) )
          siteName = siteName[0]

        try {
          siteName = siteName.toLowerCase();  
        } catch (error) {
          throw new Error(
            'siteName: ' + siteName + '\n' +
            'Requires a valid site name.' )
        }

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

    program.command('recreate [siteName]')
      .description('Recreates a site using the last version of the site uploaded to the webhook servers.')
      .action(function (siteName) {
        if ( Array.isArray( siteName ) )
          siteName = siteName[0]
        
        try {
          siteName = siteName.toLowerCase();  
        } catch (error) {
          throw new Error(
            'siteName: ' + siteName + '\n' +
            'Requires a valid site name.' )
        }

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

    program.command('list-sites')
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

    program.command('preset-build')
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

    program.command('preset-build-all')
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

    program.command('backup <toFile>')
      .description('Generates a backup JSON file at the <toFile> from a webhook directory which includes data')
      .action(function (toFile) {
        if ( Array.isArray( toFile ) )
          toFile = toFile[0]

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

    program.command('restore <fromFile>')
      .description('Restores database to state captured in backup file, such as one generated from `wh backup`')
      .action(function (fromFile) {
        if ( Array.isArray( fromFile ) )
          fromFile = fromFile[0]

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

    program.command('update')
      .description('Updates a webhook site with the latest generate code')
      .action(function () {
        require('./lib/update.js')({
          firebase: program.firebase,
          server: program.server,
          embedly: program.embedly,
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

    program.command('push')
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
      
    program.command('deploy')
      .description('Push webhook directory to server')
      .action(function () {
        require('./lib/push.js')({
          firebase: program.firebase,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          token: program.token,
          email: program.email,
          skipBuild: program.skipBuild,
        });
      });

    program.command('reset-keys')
      .description('Resets user passwords and site keys.')
      .action(function () {
        require('./lib/reset-keys')({
          firebaseName: program.firebase,
          firebaseToken: program.token,
        })
      })

    program.command('reset-keys:sites')
      .description('Resets site keys.')
      .action(function () {
        require('./lib/reset-keys')({
          firebaseName: program.firebase,
          firebaseToken: program.token,
          resetUserPasswords: false,
        })
      })

     program.command('reset-keys:users')
      .description('Resets site keys.')
      .action(function () {
        require('./lib/reset-keys')({
          firebaseName: program.firebase,
          firebaseToken: program.token,
          resetSiteKeys: false,
        })
      })

    program.command('serve [port]')
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
          cache: program.cache,
          skipBuild: program.skipBuild,
        });
      });

    program.command('clone-content-under <namespace>')
      .description('Clones content type and current data under a new namespace.')
      .action(function (namespace) {
        
        var contentTypes = ((typeof program.types === 'string')
          ? program.types.split(',')
          : '*' )

        require('./lib/clone-content-under.js')({
          firebaseName: program.firebase,
          firebaseToken: program.token,
          namespace: namespace,
          contentTypes: contentTypes,
        });

      });

    program.command('deploy-static')
      .description('Push a static snapshot of the current site, or --staticFolder.')
      .action(function () {

        require('./lib/deploy-static.js')({
          gcloud: program.gcloud,
          staticFolder: program.staticFolder,
          staticPrefix: program.staticPrefix,
        })
      })

    program.command('echo-options')
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
module.exports.lib = {
  init: require('./lib/init.js'),
  create: require('./lib/create.js'),
  recreate: require('./lib/recreate.js'),
  delete: require('./lib/delete.js'),
  push: require( './lib/push.js' ),
  deploys: require( './lib/deploys.js' ),
  resetKeys: require( './lib/reset-keys/index.js' ),
  user: require( './lib/user.js' ),
  listSites: require( './lib/list-sites.js' ),
  presetBuild: require( './lib/preset-build.js' ),
  restore: require( './lib/restore.js' ),
  update: require( './lib/update.js' ),
  serve: require( './lib/serve.js' ),
  cloneContentUnder: require('./lib/clone-content-under.js'),
  deployStatic: require('./lib/deploy-static.js'),
  util: require('./lib/util.js'),
  // echoOptions
}