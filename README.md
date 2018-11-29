# @risd/wh Overview

This repository is for the Webhook command line tools. There are several other repositories in Webhook's core.

* [@risd/wh](https://github.com/risd/webhook) - The Webhook command line tools.
* [@risd/webhook-generate](https://github.com/risd/webhook-generate) - The local runserver for Webhook.
* [@risd/webhook-cms](https://github.com/risd/webhook-cms) - The CMS layer and frotend GUI. A single page Ember app.
* [@risd/webhook-server-open](https://github.com/risd/webhook-server-open) - The production server for serving and regenerating live Webhook sites.
* [webhook-images](https://github.com/risd/webhook-images) - Image resizing for the Webhook frontend. For Google App Engine.

These @risd forks of the project are currently maintained for the purposes of the Rhose Island School of Design. These forks have been developed with the intention of extending the orignal [webhook](http://www.webhook.com) platform to accomodate the team's needs. The work has been done in an open-source friendly way, keeping the details of any specific platform to the job of configuration, making it possible for others to piggy back on the work, given that they publish their own self-hosted instance.

If you are interested in self-hosting, [check the instructions here](http://www.webhook.com/docs/self-host-webhook/), per the original Webhook project.

This repository is wrapped by [rm-webhook](https://github.com/risd/rm-webhook), which can be used as a template for using this repository as a basis for publishing another instance of the platform.

## Command Line Tools

This repository contains the code for the command line tools.
These tools require an account which you can create through the command line if you need.

Webhook uses [Grunt](http://www.gruntjs.com) for its local runserver and task runner.
The Webhook command line tools are sometimes simple aliases to specific Grunt commands.

## Installation

Requires the installation of [Node JS](http://www.nodejs.org). Once installed open your
terminal and run:

```
npm install -g @risd/wh
```

## Sample Usage

The CLI has the following commands:

```
wh create sitename                 # Create a new directory/site at "sitename".
wh serve [port]                    # Serves a site locally on the optional port. Default port is 2002.
wh deploy                          # Packages local, deploys to the live server, and runs a new build.
wh update                          # Updates the site directory you're in to use the latest runserver code libraries.

# wh init creates the secret key file for a local site that doesn't have one (say a github clone).
# init must be run in an existing webhook directory.

wh init
```

## Grunt commands in the local server

The following grunt commands are supported.

```
grunt clean                       # Deletes the files in the .build/ directory.
grunt scaffolding:typename        # Generates scaffolding HTML for a passed content-type from the CMS.
grunt build                       # Runs clean, and then rebuilds the .build/ directory.
```