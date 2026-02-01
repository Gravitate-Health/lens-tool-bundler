Lens Tool Bundler
=================

This is a CLI tool to bundle FHIR lenses into a single file.

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @gravitate-health/lens-tool-bundler
$ lens-tool-bundler COMMAND
running command...
$ lens-tool-bundler (--version)
@gravitate-health/lens-tool-bundler/0.4.2 linux-x64 node-v18.19.1
$ lens-tool-bundler --help [COMMAND]
USAGE
  $ lens-tool-bundler COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`lens-tool-bundler batch-bundle [DIRECTORY]`](#lens-tool-bundler-batch-bundle-directory)
* [`lens-tool-bundler batch-check [DIRECTORY]`](#lens-tool-bundler-batch-check-directory)
* [`lens-tool-bundler batch-test [DIRECTORY]`](#lens-tool-bundler-batch-test-directory)
* [`lens-tool-bundler batch-upload [DIRECTORY]`](#lens-tool-bundler-batch-upload-directory)
* [`lens-tool-bundler bundle FILE`](#lens-tool-bundler-bundle-file)
* [`lens-tool-bundler check FILE`](#lens-tool-bundler-check-file)
* [`lens-tool-bundler help [COMMAND]`](#lens-tool-bundler-help-command)
* [`lens-tool-bundler lsenhancejs [DIRECTORY]`](#lens-tool-bundler-lsenhancejs-directory)
* [`lens-tool-bundler lslens [DIRECTORY]`](#lens-tool-bundler-lslens-directory)
* [`lens-tool-bundler new NAME`](#lens-tool-bundler-new-name)
* [`lens-tool-bundler plugins`](#lens-tool-bundler-plugins)
* [`lens-tool-bundler plugins add PLUGIN`](#lens-tool-bundler-plugins-add-plugin)
* [`lens-tool-bundler plugins:inspect PLUGIN...`](#lens-tool-bundler-pluginsinspect-plugin)
* [`lens-tool-bundler plugins install PLUGIN`](#lens-tool-bundler-plugins-install-plugin)
* [`lens-tool-bundler plugins link PATH`](#lens-tool-bundler-plugins-link-path)
* [`lens-tool-bundler plugins remove [PLUGIN]`](#lens-tool-bundler-plugins-remove-plugin)
* [`lens-tool-bundler plugins reset`](#lens-tool-bundler-plugins-reset)
* [`lens-tool-bundler plugins uninstall [PLUGIN]`](#lens-tool-bundler-plugins-uninstall-plugin)
* [`lens-tool-bundler plugins unlink [PLUGIN]`](#lens-tool-bundler-plugins-unlink-plugin)
* [`lens-tool-bundler plugins update`](#lens-tool-bundler-plugins-update)
* [`lens-tool-bundler test FILE`](#lens-tool-bundler-test-file)
* [`lens-tool-bundler upload FILE`](#lens-tool-bundler-upload-file)

## `lens-tool-bundler batch-bundle [DIRECTORY]`

Batch process and bundle multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-bundle [DIRECTORY] [-e <value>] [-f] [-d] [-s]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to bundle

FLAGS
  -d, --skip-date        do not update the date field when bundling
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --force            force bundle all lenses even if content is up to date
  -s, --skip-valid       skip lenses that already have valid base64 content

DESCRIPTION
  Batch process and bundle multiple lenses in a directory.

EXAMPLES
  $ lens-tool-bundler batch-bundle

  $ lens-tool-bundler batch-bundle ./lenses

  $ lens-tool-bundler batch-bundle ./lenses --skip-valid

  $ lens-tool-bundler batch-bundle ./lenses --skip-date

  $ lens-tool-bundler batch-bundle ./lenses --exclude "test.*"
```

_See code: [src/commands/batch-bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/batch-bundle.ts)_

## `lens-tool-bundler batch-check [DIRECTORY]`

Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

```
USAGE
  $ lens-tool-bundler batch-check [DIRECTORY] [-q] [-j]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for lens files

FLAGS
  -j, --json   output results as JSON
  -q, --quiet  suppress output, only return exit code

DESCRIPTION
  Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

EXAMPLES
  $ lens-tool-bundler batch-check

  $ lens-tool-bundler batch-check ./lenses

  $ lens-tool-bundler batch-check -q

  $ lens-tool-bundler batch-check --json
```

_See code: [src/commands/batch-check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/batch-check.ts)_

## `lens-tool-bundler batch-test [DIRECTORY]`

Batch test multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-test [DIRECTORY] [-e <value>] [-f] [-v]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to test

FLAGS
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --fail-fast        stop on first test failure
  -v, --verbose          show detailed test output for each lens

DESCRIPTION
  Batch test multiple lenses in a directory.

EXAMPLES
  $ lens-tool-bundler batch-test

  $ lens-tool-bundler batch-test ./lenses

  $ lens-tool-bundler batch-test ./lenses --exclude "test.*"

  $ lens-tool-bundler batch-test ./lenses --verbose
```

_See code: [src/commands/batch-test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/batch-test.ts)_

## `lens-tool-bundler batch-upload [DIRECTORY]`

Batch process and upload multiple lenses to a FHIR server.

```
USAGE
  $ lens-tool-bundler batch-upload [DIRECTORY] -d <value> [-e <value>] [-f] [-t] [-s]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to upload

FLAGS
  -d, --domain=<value>   (required) domain where FHIR server is hosted (with http/https)
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --force            force bundle all lenses even if content is up to date
  -s, --skip-valid       skip lenses that already have valid base64 content
  -t, --skip-date        do not update the date field when bundling

DESCRIPTION
  Batch process and upload multiple lenses to a FHIR server.

EXAMPLES
  $ lens-tool-bundler batch-upload -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --skip-valid

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --exclude "test.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/batch-upload.ts)_

## `lens-tool-bundler bundle FILE`

Bundles raw lenses into a FHIR compliant single file.

```
USAGE
  $ lens-tool-bundler bundle FILE [-d] [-n <value>] [-u] [-p]

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --default       use default values for the bundle
  -n, --name=<value>  name to apply to lens
  -p, --package-json  use values from package.json to populate FHIR library
  -u, --update        update existing bundle file (content and date only)

DESCRIPTION
  Bundles raw lenses into a FHIR compliant single file.

EXAMPLES
  $ lens-tool-bundler bundle lens.js -n my-lens

  $ lens-tool-bundler bundle lens.js -n my-lens -d

  $ lens-tool-bundler bundle lens.js -p

  $ lens-tool-bundler bundle lens.js -u
```

_See code: [src/commands/bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/bundle.ts)_

## `lens-tool-bundler check FILE`

Check integrity between JavaScript file and FHIR Library bundle content.

```
USAGE
  $ lens-tool-bundler check FILE [-n <value>] [-b <value>] [-q]

ARGUMENTS
  FILE  JavaScript file to check

FLAGS
  -b, --bundle=<value>  path to the bundle file to check
  -n, --name=<value>    name of the bundle to check (without .json extension)
  -q, --quiet           suppress output, only return exit code

DESCRIPTION
  Check integrity between JavaScript file and FHIR Library bundle content.

EXAMPLES
  $ lens-tool-bundler check mylens.js

  $ lens-tool-bundler check mylens.js -n MyLens

  $ lens-tool-bundler check mylens.js -b MyLens.json
```

_See code: [src/commands/check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/check.ts)_

## `lens-tool-bundler help [COMMAND]`

Display help for lens-tool-bundler.

```
USAGE
  $ lens-tool-bundler help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for lens-tool-bundler.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.1/src/commands/help.ts)_

## `lens-tool-bundler lsenhancejs [DIRECTORY]`

List valid enhance JavaScript files in a directory (similar to ls).

```
USAGE
  $ lens-tool-bundler lsenhancejs [DIRECTORY] [-d] [-j]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for enhance JS files

FLAGS
  -d, --details  show details about matches (exact vs fallback)
  -j, --json     output as JSON format

DESCRIPTION
  List valid enhance JavaScript files in a directory (similar to ls).

EXAMPLES
  $ lens-tool-bundler lsenhancejs

  $ lens-tool-bundler lsenhancejs ./lenses

  $ lens-tool-bundler lsenhancejs -d

  $ lens-tool-bundler lsenhancejs ./lenses | xargs -I {} echo "Processing: {}"
```

_See code: [src/commands/lsenhancejs.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/lsenhancejs.ts)_

## `lens-tool-bundler lslens [DIRECTORY]`

List valid FHIR lenses in a directory (similar to ls).

```
USAGE
  $ lens-tool-bundler lslens [DIRECTORY] [-a] [-j] [-v]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for lenses

FLAGS
  -a, --all       include lenses that may be missing content (base64 data)
  -j, --json      output as JSON format
  -v, --validate  include full validation report for each lens

DESCRIPTION
  List valid FHIR lenses in a directory (similar to ls).

EXAMPLES
  $ lens-tool-bundler lslens

  $ lens-tool-bundler lslens ./lenses

  $ lens-tool-bundler lslens -a

  $ lens-tool-bundler lslens -v

  $ lens-tool-bundler lslens ./lenses | xargs -I {} echo "Processing: {}"
```

_See code: [src/commands/lslens.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/lslens.ts)_

## `lens-tool-bundler new NAME`

Creates a new lens with JavaScript file and FHIR bundle.

```
USAGE
  $ lens-tool-bundler new NAME [-d] [-f]

ARGUMENTS
  NAME  name of the lens to create

FLAGS
  -d, --default  use default values for the bundle
  -f, --force    overwrite existing files if they exist

DESCRIPTION
  Creates a new lens with JavaScript file and FHIR bundle.

EXAMPLES
  $ lens-tool-bundler new MyLens

  $ lens-tool-bundler new MyLens -d
```

_See code: [src/commands/new.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/new.ts)_

## `lens-tool-bundler plugins`

List installed plugins.

```
USAGE
  $ lens-tool-bundler plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ lens-tool-bundler plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/index.ts)_

## `lens-tool-bundler plugins add PLUGIN`

Installs a plugin into lens-tool-bundler.

```
USAGE
  $ lens-tool-bundler plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into lens-tool-bundler.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the LENS_TOOL_BUNDLER_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the LENS_TOOL_BUNDLER_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ lens-tool-bundler plugins add myplugin

  Install a plugin from a github url.

    $ lens-tool-bundler plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ lens-tool-bundler plugins add someuser/someplugin
```

## `lens-tool-bundler plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ lens-tool-bundler plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ lens-tool-bundler plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/inspect.ts)_

## `lens-tool-bundler plugins install PLUGIN`

Installs a plugin into lens-tool-bundler.

```
USAGE
  $ lens-tool-bundler plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into lens-tool-bundler.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the LENS_TOOL_BUNDLER_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the LENS_TOOL_BUNDLER_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ lens-tool-bundler plugins install myplugin

  Install a plugin from a github url.

    $ lens-tool-bundler plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ lens-tool-bundler plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/install.ts)_

## `lens-tool-bundler plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ lens-tool-bundler plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ lens-tool-bundler plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/link.ts)_

## `lens-tool-bundler plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove

EXAMPLES
  $ lens-tool-bundler plugins remove myplugin
```

## `lens-tool-bundler plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ lens-tool-bundler plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/reset.ts)_

## `lens-tool-bundler plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove

EXAMPLES
  $ lens-tool-bundler plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/uninstall.ts)_

## `lens-tool-bundler plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove

EXAMPLES
  $ lens-tool-bundler plugins unlink myplugin
```

## `lens-tool-bundler plugins update`

Update installed plugins.

```
USAGE
  $ lens-tool-bundler plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/update.ts)_

## `lens-tool-bundler test FILE`

Run comprehensive tests on a FHIR lens.

```
USAGE
  $ lens-tool-bundler test FILE [-v]

ARGUMENTS
  FILE  lens file to test (JSON format)

FLAGS
  -v, --verbose  show detailed test output

DESCRIPTION
  Run comprehensive tests on a FHIR lens.

EXAMPLES
  $ lens-tool-bundler test my-lens.json

  $ lens-tool-bundler test ./lenses/enhance-lens.json
```

_See code: [src/commands/test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/test.ts)_

## `lens-tool-bundler upload FILE`

upload file (json format) to a valid FHIR server.

```
USAGE
  $ lens-tool-bundler upload FILE -d <value>

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --domain=<value>  (required) domain where FHIR server is hosted (with http/https)

DESCRIPTION
  upload file (json format) to a valid FHIR server.

EXAMPLES
  $ lens-tool-bundler upload
```

_See code: [src/commands/upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.4.2/src/commands/upload.ts)_
<!-- commandsstop -->
