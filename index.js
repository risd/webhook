process.env.DEBUG = "*"
const program = require("commander")
const errors = require("./lib/errors.js")
const version = require("./package.json").version
const printIntro = require("./lib/util/print-intro")
const unescape = require("./lib/util/unescape-site")
const cliCmd = "wh"

module.exports = function (argv) {
  program
    .version(version)
    .option(
      "-f, --firebase [firebaseName]",
      "Use the specified firebase instead of webhook main, for self hosting mode"
    )
    .option(
      "-t, --firebaseToken [firebaseToken]",
      "Use this auth token for firebase instead of prompting for login"
    )
    .option(
      "-s, --server [uploadserver]",
      "Use this server when uploading files, for self hosting mode"
    )
    .option(
      "-m, --embedly [embedly]",
      "Use this embedly key when writing .firebase.conf, for self hosting mode"
    )
    .option(
      "-b, --generate [generate]",
      "Use this generator URL when creating a new site, for self hosting mode"
    )
    .option(
      "-h, --imgix_host [imgixhost]",
      "Use this URL for imgix CDN serving, for self hosting mode"
    )
    .option(
      "-x, --imgix_secret [imgixsecret]",
      "Use this secret to sign imgix URLs, for self hosting mode"
    )
    .option(
      "-n, --npm [npmPath]",
      "Use this npm executable over the default one (npm)"
    )
    .option(
      "-o, --node [nodePath]",
      "Use this node executable over the default one (node)"
    )
    .option(
      "-g, --grunt [gruntPath]",
      "Use this grunt executable over the default one (grunt)"
    )
    .option("-f, --force [force]", "If true, will force update")
    .option("-c, --cache [cacheDir]", "Sets the directory to use for npm cache")
    .option(
      "-e, --email [email]",
      "The e-mail address to use when using the --token option"
    )
    .option(
      "-d, --debug",
      "Set to debug mode. Logs out progress through processes."
    )
    .option(
      "--types [contentTypes]",
      "Clone these content types. If omitted, all content types are cloned."
    )
    .option(
      "--skipBuild",
      "Skips the site build as a step to ensure templates are okay before deploying."
    )
    .option("--gcloud [gcloud]", "Path to Google Project JSON file.")
    .option(
      "--staticFolder [staticFolder]",
      "Path to local folder to push folder."
    )
    .option(
      "--staticPrefix [staticPrefix]",
      "Prefix to add to the static directory being pushed."
    )
    .option(
      "--branch [branch]",
      "Git branch to use, instead of the current branch."
    )
    .option(
      "--firebaseAPIKey [firebaseAPIKey]",
      "The Firebase web API key to use."
    )
    .option(
      "--platformName [platformName]",
      "The name of the webhook publishing platform instance."
    )
    .option(
      "--force [force]",
      "Skip any interactive prompts to confirm command execution."
    )

  program
    .command("create <siteName>")
    .description("Create a new webhook site")
    .action(async function (siteName) {
      if (Array.isArray(siteName)) siteName = siteName[0]

      try {
        siteName = siteName.toLowerCase()
      } catch (error) {
        throw new Error(
          "siteName: " + siteName + "\n" + "Requires a valid site name."
        )
      }

      if (program.firebase) {
        siteName = siteName.replace(/\./g, ",1")
      }

      printIntro(program.platformName)

      const Create = require("./lib/create.js")

      try {
        await Create({
          siteName: siteName,
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          embedly: program.embedly,
          server: program.server,
          generate: program.generate,
          imgix_host: program.imgix_host,
          imgix_secret: program.imgix_secret,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          force: program.force,
          cache: program.cache,
        })
        Create.cliLogSuccess({ siteName })
      } catch (error) {
        Create.cliLogError(error, { siteName })
      }
    })

  program
    .command("init <siteName>")
    .description("Initializes a site with configuration files")
    .action(async function (siteName) {
      if (Array.isArray(siteName)) siteName = siteName[0]

      try {
        siteName = siteName.toLowerCase()
      } catch (error) {
        throw new Error(
          "siteName: " + siteName + "\n" + "Requires a valid site name."
        )
      }

      if (program.firebase) {
        siteName = siteName.replace(/\./g, ",1")
      }

      const Init = require("./lib/init.js")

      try {
        await Init({
          siteName: siteName,
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          embedly: program.embedly,
          generate: program.generate,
          imgix_host: program.imgix_host,
          imgix_secret: program.imgix_secret,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          cache: program.cache,
        })
        Init.cliLogSuccess()
      } catch (error) {
        Init.cliLogError(error)
      }
    })

  program
    .command("github")
    .description(
      "Display the current git user/repo configuration for the site."
    )
    .action(async function () {
      const GithubConfiguration = require("./lib/github")

      try {
        const { siteName, github } = await GithubConfiguration({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
        })
        GithubConfiguration.cliLogSuccessGet({ siteName, github })
      } catch (error) {
        GithubConfiguration.cliLogError(error)
      }
    })

  program
    .command("github:set <userRepo>")
    .description(
      "Set the git user/repo configuration for the current site directory."
    )
    .action(async function (userRepo) {
      if (typeof userRepo !== "string")
        console.log(
          "Set requires a user/repo name be passed in. For example: google/leveldb"
        )

      const GithubConfiguration = require("./lib/github")

      try {
        const { siteName, github } = await GithubConfiguration({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          gitSet: userRepo,
        })

        GithubConfiguration.cliLogSuccessSet({ siteName, github })
      } catch (error) {
        GithubConfiguration.cliLogError(error)
      }
    })

  program
    .command("github:remove")
    .description(
      "Remove the git user/repo configuration for the current site directory."
    )
    .action(async function () {
      const GithubConfiguration = require("./lib/github")
      try {
        const { siteName } = await GithubConfiguration({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          gitRemove: true,
        })
        GithubConfiguration.cliLogSuccessRemove({ siteName })
      } catch (error) {
        GithubConfiguration.cliLogError(error)
      }
    })

  program
    .command("deploys")
    .description("List all deploy configuration for the current webhook site")
    .action(async function () {
      const DeployConfiguration = require("./lib/deploys.js")
      try {
        const { deploys } = await DeployConfiguration({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
        })

        DeployConfiguration.cliLogSuccess({ deploys })
      } catch (error) {
        DeployConfiguration.cliLogError(error)
      }
    })

  program
    .command("deploys:set <bucketName>")
    .description(
      "Set a bucket as the deploy destination. Use the --branch flag to override setting the deploy to use the current branch's set of templates."
    )
    .action(async function (bucketName) {
      if (typeof bucketName !== "string")
        console.log("Set requires a bucket name be passed in.")

      const DeployConfiguration = require("./lib/deploys.js")
      try {
        const { deploys } = await DeployConfiguration({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          branch: program.branch,
          bucketSet: bucketName,
        })
        DeployConfiguration.cliLogSuccess({ deploys })
      } catch (error) {
        DeployConfiguration.cliLogError(error)
      }
    })

  program
    .command("deploys:remove <bucketName>")
    .description("Remove a bucket as a deploy destination.")
    .action(async function (bucketName) {
      if (typeof bucketName !== "string")
        console.log("Set requires a bucket name be passed in.")

      const DeployConfiguration = require("./lib/deploys.js")
      try {
        const { deploys } = await DeployConfiguration({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          bucketRemove: bucketName,
        })

        DeployConfiguration.cliLogSuccess({ deploys })
      } catch (error) {
        DeployConfiguration.cliLogError(error)
      }
    })

  program
    .command("conf <siteName>")
    .description(
      "Initializes a site with configuration files. Assumes node_modules are already installed."
    )
    .action(async function (siteName) {
      if (Array.isArray(siteName)) siteName = siteName[0]

      try {
        siteName = siteName.toLowerCase()
      } catch (error) {
        throw new Error(
          "siteName: " + siteName + "\n" + "Requires a valid site name."
        )
      }

      if (program.firebase) {
        siteName = siteName.replace(/\./g, ",1")
      }

      const Conf = require("./lib/conf.js")

      try {
        await Conf({
          siteName: siteName,
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          embedly: program.embedly,
          generate: program.generate,
          imgix_host: program.imgix_host,
          imgix_secret: program.imgix_secret,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          cache: program.cache,
        })
        Conf.cliLogSuccess()
      } catch (error) {
        Conf.cliLogError(error, { platformName: program.platformName })
      }
    })

  program
    .command("list-sites")
    .description("Lists all the sites that the user is an owner/user on")
    .action(async function () {
      const ListSites = require("./lib/list-sites.js")
      try {
        const { userSites } = await ListSites({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
        })
        ListSites.cliLogSuccess({ userSites })
      } catch (error) {
        ListSites.cliLogError(error)
      }
    })

  program
    .command("preset-build")
    .description("Generates a .preset-data.json file from a webhook directory")
    .action(async function () {
      const PresetBuild = require("./lib/preset-build.js")
      try {
        const { pathToWrite } = await PresetBuild({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          toFile: null, // use the default
          all: false,
        })
        PresetBuild.cliLogSuccess({ pathToWrite })
      } catch (error) {
        PresetBuild.cliLogError(error)
      }
    })

  program
    .command("preset-build-all")
    .description(
      "Generates a .preset-data.json file from a webhook directory which includes data"
    )
    .action(async function () {
      const PresetBuild = require("./lib/preset-build.js")
      try {
        const { pathToWrite } = await PresetBuild({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          toFile: null, // use the default
          all: true,
        })
        PresetBuild.cliLogSuccess({ pathToWrite })
      } catch (error) {
        PresetBuild.cliLogError(error)
      }
    })

  program
    .command("backup <toFile>")
    .description(
      "Generates a backup JSON file at the <toFile> from a webhook directory which includes data"
    )
    .action(async function (toFile) {
      if (Array.isArray(toFile)) {
        toFile = toFile[0]
      } else {
        toFile = "backup.json"
      }
      const PresetBuild = require("./lib/preset-build.js")
      try {
        const { pathToWrite } = await PresetBuild({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          toFile,
          all: true,
        })
        PresetBuild.cliLogSuccess({ pathToWrite })
      } catch (error) {
        PresetBuild.cliLogError(error)
      }
    })

  program
    .command("restore <fromFile>")
    .description(
      "Restores database to state captured in backup file, such as one generated from `wh backup`"
    )
    .action(async function (fromFile) {
      if (Array.isArray(fromFile)) {
        fromFile = fromFile[0]
      }

      const Restore = require("./lib/restore.js")

      try {
        const { updated } = await Restore({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          fromFile: fromFile,
        })
        Restore.cliLogSuccess({ fromFile, updated })
      } catch (error) {
        Restore.cliLogError(error, { fromFile })
      }
    })

  program
    .command("update")
    .description("Updates a webhook site with the latest generate code")
    .action(async function () {
      const Update = require("./lib/update.js")
      try {
        await Update({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          embedly: program.embedly,
          imgix_host: program.imgix_host,
          imgix_secret: program.imgix_secret,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          force: program.force,
          cache: program.cache,
        })
        Update.cliLogSuccess({ cliCmd })
      } catch (error) {
        Update.cliLogError(error)
      }
    })

  async function pusher() {
    const Push = require("./lib/push.js")
    try {
      await Push({
        firebaseName: program.firebase,
        firebaseToken: program.firebaseToken,
        firebaseAPIKey: program.firebaseAPIKey,
        server: program.server,
        npm: program.npm,
        node: program.node,
        grunt: program.grunt,
        email: program.email,
        skipBuild: program.skipBuild,
      })
      Push.cliLogSuccess()
    } catch (error) {
      Push.cliLogError(error)
    }
  }

  program
    .command("push")
    .description("Push webhook directory to server")
    .action(pusher)

  program
    .command("deploy")
    .description("Push webhook directory to server")
    .action(pusher)

  program
    .command("map-domain <maskDomain> [contentDomain]")
    .description(
      "Configure the maskDomain to pull content from the contentDomain."
    )
    .action(async function (maskDomain, contentDomain) {
      const MapDomain = require("./lib/map-domain")
      try {
        await MapDomain({
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          maskDomain,
          contentDomain,
        })
        MapDomain.cliLogSuccess({ maskDomain, contentDomain })
      } catch (error) {
        MapDomain.cliLogError(error)
      }
    })

  program
    .command("serve [port]")
    .description("Serves a webhook site locally")
    .action(async function (port) {
      const Serve = require("./lib/serve.js")
      try {
        await Serve({
          port: port || null,
          firebaseName: program.firebase,
          firebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          server: program.server,
          npm: program.npm,
          node: program.node,
          grunt: program.grunt,
          email: program.email,
          cache: program.cache,
          skipBuild: program.skipBuild,
        })
      } catch (error) {
        Serve.cliLogError(error)
      }
    })

  program
    .command("deploy-static [siteName]")
    .description(
      "Push a static snapshot of the current site, or --staticFolder to domains configured via `wh deploys`."
    )
    .action(async function (siteName) {
      const DeployStatic = require("./lib/deploy-static.js")
      try {
        await DeployStatic({
          firebaseName: program.firebase,
          firebasefirebaseToken: program.firebaseToken,
          firebaseAPIKey: program.firebaseAPIKey,
          gcloud: program.gcloud,
          staticFolder: program.staticFolder,
          staticPrefix: program.staticPrefix,
          siteName: siteName,
          skipBuild: program.skipBuild,
          branch: program.branch,
        })
      } catch (error) {
        DeployStatic.cliLogError(error)
      }
    })

  program
    .command("push-static [domain]")
    .description(
      "Push a static directory (--staticFolder) to the domain passed in as the first argument, augmented by the current git branch (or --gitBranch value)."
    )
    .action(async function (domain) {
      const PushStatic = require("./lib/push-static.js")
      try {
        const { directory, siteName, sitePath } = await {
          debug: program.debug,
          gcloud: program.gcloud,
          branch: program.branch,
          baseDomain: domain,
          staticFolder: program.staticFolder,
          staticPrefix: program.staticPrefix,
        }
        PushStatic.cliLogSuccess({ directory, siteName, sitePath })
      } catch (error) {
        PushStatic.cliLogError(error)
      }
    })

  program
    .command("echo-options")
    .description("Echos options passed into this command, used for debugging")
    .action(function () {
      console.log(`firebase: ${program.firebase}`)
      console.log(`firebaseToken: ${program.firebaseToken}`)
      console.log(`firebaseAPIKey: ${program.firebaseAPIKey}`)
      console.log(`server: ${program.server}`)
      console.log(`embedly: ${program.embedly}`)
      console.log(`generate: ${program.generate}`)
      console.log(`imgix_host: ${program.imgix_host}`)
      console.log(`imgix_secret: ${program.imgix_secret}`)
      console.log(`npm: ${program.npm}`)
      console.log(`node: ${program.node}`)
      console.log(`grunt: ${program.grunt}`)
      console.log(`email: ${program.email}`)
      console.log(`debug: ${program.debug}`)
      console.log(`types: ${program.types}`)
      console.log(`skipBuild: ${program.skipBuild}`)
      console.log(`gcloud: ${program.gcloud}`)
      console.log(`staticFolder: ${program.staticFolder}`)
      console.log(`staticPrefix: ${program.staticPrefix}`)
      console.log(`force: ${program.force}`)
      console.log(`platformName: ${program.platformName}`)
    })

  program.parse(argv)

  if (!program.args.length) program.help()
}

module.exports.version = version
module.exports.lib = {
  init: require("./lib/init.js"),
  conf: require("./lib/conf.js"),
  create: require("./lib/create.js"),
  push: require("./lib/push.js"),
  deploys: require("./lib/deploys.js"),
  github: require("./lib/github.js"),
  mapDomain: require("./lib/map-domain.js"),
  listSites: require("./lib/list-sites.js"),
  presetBuild: require("./lib/preset-build.js"),
  restore: require("./lib/restore.js"),
  update: require("./lib/update.js"),
  serve: require("./lib/serve.js"),
  deployStatic: require("./lib/deploy-static.js"),
  pushStatic: require("./lib/push-static.js"),
  util: require("./lib/util/index.js"),
  siteDir: require("./lib/util/site-dir.js"),
}
