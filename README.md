# Lens Tool Bundler

[![npm version](https://img.shields.io/npm/v/@gravitate-health/lens-tool-bundler.svg)](https://www.npmjs.com/package/@gravitate-health/lens-tool-bundler)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/node/v/@gravitate-health/lens-tool-bundler.svg)](https://nodejs.org)
[![npm downloads](https://img.shields.io/npm/dm/@gravitate-health/lens-tool-bundler.svg)](https://www.npmjs.com/package/@gravitate-health/lens-tool-bundler)

> CLI tool for creating, bundling, testing, and deploying FHIR-compliant Gravitate Health lenses - JavaScript enhancement functions that personalize electronic product information (ePI) for patients.

## Features

✨ **Create**: Scaffold new lenses from templates or clone full repository with testing framework  
📦 **Bundle**: Convert JavaScript lens functions into FHIR Library resources  
🧪 **Test**: Run comprehensive validation and content preservation tests  
🚀 **Deploy**: Upload lenses to FHIR servers with smart update/create logic  
✅ **Validate**: Check integrity between source code and bundles  
� **List**: Discover and list lenses with ls-like output (pipe-friendly)  
�🔄 **Batch Operations**: Process multiple lenses at once with smart filtering

## Quick Start

```bash
# Install globally
npm install -g @gravitate-health/lens-tool-bundler

# Create a new lens project
lens-tool-bundler new MyLens --template

# List all lenses (clean ls-like output)
lens-tool-bundler lslens ./lenses

# Bundle a lens
lens-tool-bundler bundle mylens.js -p

# Test the lens
lens-tool-bundler test mylens.json

# Upload to FHIR server
lens-tool-bundler upload mylens.json -d https://your-fhir-server.com/api/fhir

# Pipe-friendly batch processing
lens-tool-bundler lslens ./lenses | xargs -I {} lens-tool-bundler test {}
```

## Table of Contents

<!-- toc -->
* [Lens Tool Bundler](#lens-tool-bundler)
* [Install globally](#install-globally)
* [Create a new lens project](#create-a-new-lens-project)
* [Bundle a lens](#bundle-a-lens)
* [Test the lens](#test-the-lens)
* [Upload to FHIR server](#upload-to-fhir-server)
* [Usage](#usage)
* [Exit Codes](#exit-codes)
* [Example: Fail CI pipeline if tests fail](#example-fail-ci-pipeline-if-tests-fail)
* [Example: Check integrity and continue on success](#example-check-integrity-and-continue-on-success)
* [Source Encoding](#source-encoding)
* [Bundle a latin1-encoded source file](#bundle-a-latin1-encoded-source-file)
* [Check integrity with a specific source encoding](#check-integrity-with-a-specific-source-encoding)
* [File Exclusions](#file-exclusions)
* [Exclude test files and draft lenses](#exclude-test-files-and-draft-lenses)
* [Exclude multiple patterns](#exclude-multiple-patterns)
* [Exclude specific directories](#exclude-specific-directories)
* [Commands](#commands)
<!-- tocstop -->
* [Lens Tool Bundler](#lens-tool-bundler)
* [Install globally](#install-globally)
* [Create a new lens project](#create-a-new-lens-project)
* [Bundle a lens](#bundle-a-lens)
* [Test the lens](#test-the-lens)
* [Upload to FHIR server](#upload-to-fhir-server)
* [Usage](#usage)
* [Exit Codes](#exit-codes)
* [Example: Fail CI pipeline if tests fail](#example-fail-ci-pipeline-if-tests-fail)
* [Example: Check integrity and continue on success](#example-check-integrity-and-continue-on-success)
* [Source Encoding](#source-encoding)
* [Bundle a latin1-encoded source file](#bundle-a-latin1-encoded-source-file)
* [Check integrity with a specific source encoding](#check-integrity-with-a-specific-source-encoding)
* [Commands](#commands)
<!-- tocstop -->
* [Features](#features)
* [Quick Start](#quick-start)
* [Contributing](#contributing)
* [Support](#support)
* [License](#license)
* [Acknowledgments](#acknowledgments)
* [Usage](#usage)
* [Exit Codes](#exit-codes)
* [Source Encoding](#source-encoding)
* [Commands](#commands)
<!-- tocstop -->

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on:
- Code of conduct
- Development setup
- Submitting pull requests
- Coding standards

### Testing

The project has comprehensive test coverage with 143 tests, all passing:
- **84 unit/integration tests**: Models, controllers, batch operations, and encoding scenarios
- **59 command tests**: All CLI commands with proper oclif v4 patterns

```bash
npm test               # Run all tests (143 passing)
npm run lint           # Run ESLint
```

**Testing Framework**: @oclif/test v4.1.16 with Mocha + Chai
- Uses `runCommand()` pattern for command testing
- Proper exit code handling (0=success, 1=validation failure, 2=fatal error)
- See [test/README.md](test/README.md) for detailed test documentation

## Support

- 📖 [Full Documentation](https://github.com/Gravitate-Health/lens-tool-bundler)
- 🐛 [Report Issues](https://github.com/Gravitate-Health/lens-tool-bundler/issues)
- 💬 [Discussions](https://github.com/Gravitate-Health/lens-tool-bundler/discussions)
- 🔒 [Security Policy](SECURITY.md)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.txt](LICENSE.txt) file for details.

## Acknowledgments

This project is part of the [Gravitate Health](https://www.gravitatehealth.eu) initiative, funded by the European Union.

---

# Usage
<!-- usage -->
```sh-session
$ npm install -g @gravitate-health/lens-tool-bundler
$ lens-tool-bundler COMMAND
running command...
$ lens-tool-bundler (--version)
@gravitate-health/lens-tool-bundler/0.5.4 win32-x64 node-v25.4.0
$ lens-tool-bundler --help [COMMAND]
USAGE
  $ lens-tool-bundler COMMAND
...
```
<!-- usagestop -->
```sh-session
$ npm install -g @gravitate-health/lens-tool-bundler
$ lens-tool-bundler COMMAND
running command...
$ lens-tool-bundler (--version)
@gravitate-health/lens-tool-bundler/0.5.3 win32-x64 node-v25.4.0
$ lens-tool-bundler --help [COMMAND]
USAGE
  $ lens-tool-bundler COMMAND
...
```
<!-- usagestop -->
```sh-session
$ npm install -g @gravitate-health/lens-tool-bundler
$ lens-tool-bundler COMMAND
running command...
$ lens-tool-bundler (--version)
@gravitate-health/lens-tool-bundler/0.5.3 win32-x64 node-v25.4.0
$ lens-tool-bundler --help [COMMAND]
USAGE
  $ lens-tool-bundler COMMAND
...
```
<!-- usagestop -->

# Exit Codes

All commands use standard exit codes for CI/CD integration:

- **0**: Success - Command completed without errors
- **1**: Failure - Command encountered errors during execution
  - batch-bundle: One or more lenses failed to bundle
  - batch-check: One or more integrity checks failed
  - batch-test: One or more lens tests failed
  - batch-upload: One or more lenses failed to upload
  - bundle: Bundling operation failed
  - check: Integrity check failed
  - test: Lens test failed
  - upload: Upload operation failed
- **2**: Fatal error - Unexpected error during execution (used by batch-check)

Use these exit codes in scripts and CI/CD pipelines to determine command success:

```bash
# Example: Fail CI pipeline if tests fail
lens-tool-bundler batch-test ./lenses || exit 1

# Example: Check integrity and continue on success
if lens-tool-bundler check mylens.js; then
  echo "Integrity check passed"
fi
```

# Source Encoding

Lens source files are decoded to Unicode before being stored as UTF-8 in the FHIR Library content. If a source file uses a non-UTF-8 encoding, pass `--source-encoding` to ensure consistent base64 content:

```bash
# Bundle a latin1-encoded source file
lens-tool-bundler bundle mylens.js -n MyLens --source-encoding latin1

# Check integrity with a specific source encoding
lens-tool-bundler check mylens.js --source-encoding windows-1252
```

# File Exclusions

Batch commands (`batch-bundle`, `batch-check`, `batch-test`, `batch-upload`) automatically exclude certain files and directories to optimize processing:

**Default Exclusions:**
- `node_modules/` - Dependencies directory
- `package.json` - npm package configuration
- `package-lock.json` - npm lockfile

You can add additional exclusion patterns using the `--exclude` flag (can be used multiple times):

```bash
# Exclude test files and draft lenses
lens-tool-bundler batch-bundle ./lenses --exclude "test.*" --exclude ".*\\.draft\\.json$"

# Exclude multiple patterns
lens-tool-bundler batch-test ./lenses --exclude "experimental" --exclude ".*\\.bak\\."

# Exclude specific directories
lens-tool-bundler batch-check ./lenses --exclude "archive/" --exclude "temp/"
```

**Note:** Exclusion patterns are applied to both filenames and directory names as regular expressions, preventing traversal into excluded directories for better performance.

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
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:inspect PLUGIN...`](#lens-tool-bundler-pluginsinspect-plugin)
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:link PLUGIN`](#lens-tool-bundler-pluginslink-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins update`](#lens-tool-bundler-plugins-update)
* [`lens-tool-bundler test FILE`](#lens-tool-bundler-test-file)
* [`lens-tool-bundler upload FILE`](#lens-tool-bundler-upload-file)

## `lens-tool-bundler batch-bundle [DIRECTORY]`

Batch process and bundle multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-bundle [DIRECTORY] [-e <value>...] [-f] [-d] [-s] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to bundle

FLAGS
  -d, --skip-date                do not update the date field when bundling
  -e, --exclude=<value>...       regex pattern to exclude files/directories (can be used multiple times)
  -f, --force                    force bundle all lenses even if content is up to date
  -s, --skip-valid               skip lenses that already have valid base64 content
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and bundle multiple lenses in a directory.

EXAMPLES
  $ lens-tool-bundler batch-bundle

  $ lens-tool-bundler batch-bundle ./lenses

  $ lens-tool-bundler batch-bundle ./lenses --skip-valid

  $ lens-tool-bundler batch-bundle ./lenses --skip-date

  $ lens-tool-bundler batch-bundle ./lenses --exclude "test.*" --exclude ".*\.draft\.json$"

  $ lens-tool-bundler batch-bundle ./lenses --exclude "node_modules"
```

_See code: [src/commands/batch-bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/batch-bundle.ts)_

## `lens-tool-bundler batch-check [DIRECTORY]`

Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

```
USAGE
  $ lens-tool-bundler batch-check [DIRECTORY] [-e <value>...] [-j] [-q] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for lens files

FLAGS
  -e, --exclude=<value>...       regex pattern to exclude files/directories (can be used multiple times)
  -j, --json                     output results as JSON
  -q, --quiet                    suppress output, only return exit code
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

EXAMPLES
  $ lens-tool-bundler batch-check

  $ lens-tool-bundler batch-check ./lenses

  $ lens-tool-bundler batch-check -q

  $ lens-tool-bundler batch-check --json

  $ lens-tool-bundler batch-check ./lenses --exclude "test.*" --exclude ".*\.draft\.json$"
```

_See code: [src/commands/batch-check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/batch-check.ts)_

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

_See code: [src/commands/batch-test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/batch-test.ts)_

## `lens-tool-bundler batch-upload [DIRECTORY]`

Batch process and upload multiple lenses to a FHIR server.

```
USAGE
  $ lens-tool-bundler batch-upload [DIRECTORY] -d <value> [-e <value>] [-f] [-t] [-s] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to upload

FLAGS
  -d, --domain=<value>           (required) domain where FHIR server is hosted (with http/https)
  -e, --exclude=<value>          regex pattern to exclude files (applied to filename)
  -f, --force                    force bundle all lenses even if content is up to date
  -s, --skip-valid               skip lenses that already have valid base64 content
  -t, --skip-date                do not update the date field when bundling
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and upload multiple lenses to a FHIR server.

EXAMPLES
  $ lens-tool-bundler batch-upload -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --skip-valid

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --exclude "test.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/batch-upload.ts)_

## `lens-tool-bundler bundle FILE`

Bundles raw lenses into a FHIR compliant single file.

```
USAGE
  $ lens-tool-bundler bundle FILE [-d] [-n <value>] [-p] [--source-encoding <value>] [-u]

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --default                  use default values for the bundle
  -n, --name=<value>             name to apply to lens
  -p, --package-json             use values from package.json to populate FHIR library
  -u, --update                   update existing bundle file (content and date only)
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Bundles raw lenses into a FHIR compliant single file.

EXAMPLES
  $ lens-tool-bundler bundle lens.js -n my-lens

  $ lens-tool-bundler bundle lens.js -n my-lens -d

  $ lens-tool-bundler bundle lens.js -p

  $ lens-tool-bundler bundle lens.js -u

  $ lens-tool-bundler bundle lens.js -n my-lens --source-encoding windows-1252
```

_See code: [src/commands/bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/bundle.ts)_

## `lens-tool-bundler check FILE`

Check integrity between JavaScript file and FHIR Library bundle content.

```
USAGE
  $ lens-tool-bundler check FILE [-b <value>] [-n <value>] [-q] [--source-encoding <value>]

ARGUMENTS
  FILE  JavaScript file to check

FLAGS
  -b, --bundle=<value>           path to the bundle file to check
  -n, --name=<value>             name of the bundle to check (without .json extension)
  -q, --quiet                    suppress output, only return exit code
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Check integrity between JavaScript file and FHIR Library bundle content.

EXAMPLES
  $ lens-tool-bundler check mylens.js

  $ lens-tool-bundler check mylens.js -n MyLens

  $ lens-tool-bundler check mylens.js -b MyLens.json
```

_See code: [src/commands/check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/check.ts)_

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

_See code: [src/commands/lsenhancejs.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/lsenhancejs.ts)_

## `lens-tool-bundler lslens [DIRECTORY]`

List valid FHIR lenses in a directory (similar to ls).

```
USAGE
  $ lens-tool-bundler lslens [DIRECTORY] [-a] [--almost-valid] [-j] [-r] [-v]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for lenses

FLAGS
  -a, --all           include lenses that may be missing content (base64 data)
  -j, --json          output as JSON format
  -r, --show-reasons  show what is missing for full validation
  -v, --validate      include full validation report for each lens
      --almost-valid  show almost-valid lenses (missing only content or minor fields)

DESCRIPTION
  List valid FHIR lenses in a directory (similar to ls).

EXAMPLES
  $ lens-tool-bundler lslens

  $ lens-tool-bundler lslens ./lenses

  $ lens-tool-bundler lslens -a

  $ lens-tool-bundler lslens -v

  $ lens-tool-bundler lslens --almost-valid

  $ lens-tool-bundler lslens --show-reasons

  $ lens-tool-bundler lslens ./lenses | xargs -I {} echo "Processing: {}"
```

_See code: [src/commands/lslens.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/lslens.ts)_

## `lens-tool-bundler new NAME`

Creates a new lens with JavaScript file and FHIR bundle.

```
USAGE
  $ lens-tool-bundler new NAME [-d] [-f] [--fork] [-t]

ARGUMENTS
  NAME  name of the lens to create

FLAGS
  -d, --default   use default values for the bundle
  -f, --force     overwrite existing files if they exist
  -t, --template  clone the full lens-template repository with all features
      --fork      fork the template repository using GitHub CLI (requires gh CLI)

DESCRIPTION
  Creates a new lens with JavaScript file and FHIR bundle.

EXAMPLES
  $ lens-tool-bundler new MyLens

  $ lens-tool-bundler new MyLens -d

  $ lens-tool-bundler new MyLens --template

  $ lens-tool-bundler new MyLens --template --fork
```

_See code: [src/commands/new.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/new.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/index.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
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
  $ lens-tool-bundler plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/inspect.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/install.ts)_

## `lens-tool-bundler plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ lens-tool-bundler plugins link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ lens-tool-bundler plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/link.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/uninstall.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/update.ts)_

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

_See code: [src/commands/test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/test.ts)_

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

_See code: [src/commands/upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.4/src/commands/upload.ts)_
<!-- commandsstop -->
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
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:inspect PLUGIN...`](#lens-tool-bundler-pluginsinspect-plugin)
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:link PLUGIN`](#lens-tool-bundler-pluginslink-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins update`](#lens-tool-bundler-plugins-update)
* [`lens-tool-bundler test FILE`](#lens-tool-bundler-test-file)
* [`lens-tool-bundler upload FILE`](#lens-tool-bundler-upload-file)

## `lens-tool-bundler batch-bundle [DIRECTORY]`

Batch process and bundle multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-bundle [DIRECTORY] [-e <value>...] [-f] [-d] [-s] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to bundle

FLAGS
  -d, --skip-date                do not update the date field when bundling
  -e, --exclude=<value>...       regex pattern to exclude files/directories (can be used multiple times)
  -f, --force                    force bundle all lenses even if content is up to date
  -s, --skip-valid               skip lenses that already have valid base64 content
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and bundle multiple lenses in a directory.

EXAMPLES
  $ lens-tool-bundler batch-bundle

  $ lens-tool-bundler batch-bundle ./lenses

  $ lens-tool-bundler batch-bundle ./lenses --skip-valid

  $ lens-tool-bundler batch-bundle ./lenses --skip-date

  $ lens-tool-bundler batch-bundle ./lenses --exclude "test.*" --exclude ".*\.draft\.json$"

  $ lens-tool-bundler batch-bundle ./lenses --exclude "node_modules"
```

_See code: [src/commands/batch-bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-bundle.ts)_

## `lens-tool-bundler batch-check [DIRECTORY]`

Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

```
USAGE
  $ lens-tool-bundler batch-check [DIRECTORY] [-e <value>...] [-j] [-q] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for lens files

FLAGS
  -e, --exclude=<value>...       regex pattern to exclude files/directories (can be used multiple times)
  -j, --json                     output results as JSON
  -q, --quiet                    suppress output, only return exit code
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

EXAMPLES
  $ lens-tool-bundler batch-check

  $ lens-tool-bundler batch-check ./lenses

  $ lens-tool-bundler batch-check -q

  $ lens-tool-bundler batch-check --json

  $ lens-tool-bundler batch-check ./lenses --exclude "test.*" --exclude ".*\.draft\.json$"
```

_See code: [src/commands/batch-check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-check.ts)_

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

_See code: [src/commands/batch-test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-test.ts)_

## `lens-tool-bundler batch-upload [DIRECTORY]`

Batch process and upload multiple lenses to a FHIR server.

```
USAGE
  $ lens-tool-bundler batch-upload [DIRECTORY] -d <value> [-e <value>] [-f] [-t] [-s] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to upload

FLAGS
  -d, --domain=<value>           (required) domain where FHIR server is hosted (with http/https)
  -e, --exclude=<value>          regex pattern to exclude files (applied to filename)
  -f, --force                    force bundle all lenses even if content is up to date
  -s, --skip-valid               skip lenses that already have valid base64 content
  -t, --skip-date                do not update the date field when bundling
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and upload multiple lenses to a FHIR server.

EXAMPLES
  $ lens-tool-bundler batch-upload -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --skip-valid

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --exclude "test.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-upload.ts)_

## `lens-tool-bundler bundle FILE`

Bundles raw lenses into a FHIR compliant single file.

```
USAGE
  $ lens-tool-bundler bundle FILE [-d] [-n <value>] [-p] [--source-encoding <value>] [-u]

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --default                  use default values for the bundle
  -n, --name=<value>             name to apply to lens
  -p, --package-json             use values from package.json to populate FHIR library
  -u, --update                   update existing bundle file (content and date only)
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Bundles raw lenses into a FHIR compliant single file.

EXAMPLES
  $ lens-tool-bundler bundle lens.js -n my-lens

  $ lens-tool-bundler bundle lens.js -n my-lens -d

  $ lens-tool-bundler bundle lens.js -p

  $ lens-tool-bundler bundle lens.js -u

  $ lens-tool-bundler bundle lens.js -n my-lens --source-encoding windows-1252
```

_See code: [src/commands/bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/bundle.ts)_

## `lens-tool-bundler check FILE`

Check integrity between JavaScript file and FHIR Library bundle content.

```
USAGE
  $ lens-tool-bundler check FILE [-b <value>] [-n <value>] [-q] [--source-encoding <value>]

ARGUMENTS
  FILE  JavaScript file to check

FLAGS
  -b, --bundle=<value>           path to the bundle file to check
  -n, --name=<value>             name of the bundle to check (without .json extension)
  -q, --quiet                    suppress output, only return exit code
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Check integrity between JavaScript file and FHIR Library bundle content.

EXAMPLES
  $ lens-tool-bundler check mylens.js

  $ lens-tool-bundler check mylens.js -n MyLens

  $ lens-tool-bundler check mylens.js -b MyLens.json
```

_See code: [src/commands/check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/check.ts)_

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

_See code: [src/commands/lsenhancejs.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/lsenhancejs.ts)_

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

_See code: [src/commands/lslens.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/lslens.ts)_

## `lens-tool-bundler new NAME`

Creates a new lens with JavaScript file and FHIR bundle.

```
USAGE
  $ lens-tool-bundler new NAME [-d] [-f] [--fork] [-t]

ARGUMENTS
  NAME  name of the lens to create

FLAGS
  -d, --default   use default values for the bundle
  -f, --force     overwrite existing files if they exist
  -t, --template  clone the full lens-template repository with all features
      --fork      fork the template repository using GitHub CLI (requires gh CLI)

DESCRIPTION
  Creates a new lens with JavaScript file and FHIR bundle.

EXAMPLES
  $ lens-tool-bundler new MyLens

  $ lens-tool-bundler new MyLens -d

  $ lens-tool-bundler new MyLens --template

  $ lens-tool-bundler new MyLens --template --fork
```

_See code: [src/commands/new.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/new.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/index.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
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
  $ lens-tool-bundler plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/inspect.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/install.ts)_

## `lens-tool-bundler plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ lens-tool-bundler plugins link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ lens-tool-bundler plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/link.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/uninstall.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/update.ts)_

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

_See code: [src/commands/test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/test.ts)_

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

_See code: [src/commands/upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/upload.ts)_
<!-- commandsstop -->
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
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:inspect PLUGIN...`](#lens-tool-bundler-pluginsinspect-plugin)
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:link PLUGIN`](#lens-tool-bundler-pluginslink-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins update`](#lens-tool-bundler-plugins-update)
* [`lens-tool-bundler test FILE`](#lens-tool-bundler-test-file)
* [`lens-tool-bundler upload FILE`](#lens-tool-bundler-upload-file)

## `lens-tool-bundler batch-bundle [DIRECTORY]`

Batch process and bundle multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-bundle [DIRECTORY] [-e <value>] [-f] [-d] [-s] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to bundle

FLAGS
  -d, --skip-date                do not update the date field when bundling
  -e, --exclude=<value>          regex pattern to exclude files (applied to filename)
  -f, --force                    force bundle all lenses even if content is up to date
  -s, --skip-valid               skip lenses that already have valid base64 content
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and bundle multiple lenses in a directory.

EXAMPLES
  $ lens-tool-bundler batch-bundle

  $ lens-tool-bundler batch-bundle ./lenses

  $ lens-tool-bundler batch-bundle ./lenses --skip-valid

  $ lens-tool-bundler batch-bundle ./lenses --skip-date

  $ lens-tool-bundler batch-bundle ./lenses --exclude "test.*"
```

_See code: [src/commands/batch-bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-bundle.ts)_

## `lens-tool-bundler batch-check [DIRECTORY]`

Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

```
USAGE
  $ lens-tool-bundler batch-check [DIRECTORY] [-j] [-q] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for lens files

FLAGS
  -j, --json                     output results as JSON
  -q, --quiet                    suppress output, only return exit code
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

EXAMPLES
  $ lens-tool-bundler batch-check

  $ lens-tool-bundler batch-check ./lenses

  $ lens-tool-bundler batch-check -q

  $ lens-tool-bundler batch-check --json
```

_See code: [src/commands/batch-check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-check.ts)_

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

_See code: [src/commands/batch-test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-test.ts)_

## `lens-tool-bundler batch-upload [DIRECTORY]`

Batch process and upload multiple lenses to a FHIR server.

```
USAGE
  $ lens-tool-bundler batch-upload [DIRECTORY] -d <value> [-e <value>] [-f] [-t] [-s] [--source-encoding <value>]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to upload

FLAGS
  -d, --domain=<value>           (required) domain where FHIR server is hosted (with http/https)
  -e, --exclude=<value>          regex pattern to exclude files (applied to filename)
  -f, --force                    force bundle all lenses even if content is up to date
  -s, --skip-valid               skip lenses that already have valid base64 content
  -t, --skip-date                do not update the date field when bundling
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and upload multiple lenses to a FHIR server.

EXAMPLES
  $ lens-tool-bundler batch-upload -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --skip-valid

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --exclude "test.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/batch-upload.ts)_

## `lens-tool-bundler bundle FILE`

Bundles raw lenses into a FHIR compliant single file.

```
USAGE
  $ lens-tool-bundler bundle FILE [-d] [-n <value>] [-p] [--source-encoding <value>] [-u]

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --default                  use default values for the bundle
  -n, --name=<value>             name to apply to lens
  -p, --package-json             use values from package.json to populate FHIR library
  -u, --update                   update existing bundle file (content and date only)
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Bundles raw lenses into a FHIR compliant single file.

EXAMPLES
  $ lens-tool-bundler bundle lens.js -n my-lens

  $ lens-tool-bundler bundle lens.js -n my-lens -d

  $ lens-tool-bundler bundle lens.js -p

  $ lens-tool-bundler bundle lens.js -u

  $ lens-tool-bundler bundle lens.js -n my-lens --source-encoding windows-1252
```

_See code: [src/commands/bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/bundle.ts)_

## `lens-tool-bundler check FILE`

Check integrity between JavaScript file and FHIR Library bundle content.

```
USAGE
  $ lens-tool-bundler check FILE [-b <value>] [-n <value>] [-q] [--source-encoding <value>]

ARGUMENTS
  FILE  JavaScript file to check

FLAGS
  -b, --bundle=<value>           path to the bundle file to check
  -n, --name=<value>             name of the bundle to check (without .json extension)
  -q, --quiet                    suppress output, only return exit code
      --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Check integrity between JavaScript file and FHIR Library bundle content.

EXAMPLES
  $ lens-tool-bundler check mylens.js

  $ lens-tool-bundler check mylens.js -n MyLens

  $ lens-tool-bundler check mylens.js -b MyLens.json
```

_See code: [src/commands/check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/check.ts)_

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

_See code: [src/commands/lsenhancejs.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/lsenhancejs.ts)_

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

_See code: [src/commands/lslens.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/lslens.ts)_

## `lens-tool-bundler new NAME`

Creates a new lens with JavaScript file and FHIR bundle.

```
USAGE
  $ lens-tool-bundler new NAME [-d] [-f] [--fork] [-t]

ARGUMENTS
  NAME  name of the lens to create

FLAGS
  -d, --default   use default values for the bundle
  -f, --force     overwrite existing files if they exist
  -t, --template  clone the full lens-template repository with all features
      --fork      fork the template repository using GitHub CLI (requires gh CLI)

DESCRIPTION
  Creates a new lens with JavaScript file and FHIR bundle.

EXAMPLES
  $ lens-tool-bundler new MyLens

  $ lens-tool-bundler new MyLens -d

  $ lens-tool-bundler new MyLens --template

  $ lens-tool-bundler new MyLens --template --fork
```

_See code: [src/commands/new.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/new.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/index.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
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
  $ lens-tool-bundler plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/inspect.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/install.ts)_

## `lens-tool-bundler plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ lens-tool-bundler plugins link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ lens-tool-bundler plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/link.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/uninstall.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/update.ts)_

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

_See code: [src/commands/test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/test.ts)_

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

_See code: [src/commands/upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.3/src/commands/upload.ts)_
<!-- commandsstop -->
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
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:inspect PLUGIN...`](#lens-tool-bundler-pluginsinspect-plugin)
* [`lens-tool-bundler plugins:install PLUGIN...`](#lens-tool-bundler-pluginsinstall-plugin)
* [`lens-tool-bundler plugins:link PLUGIN`](#lens-tool-bundler-pluginslink-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins:uninstall PLUGIN...`](#lens-tool-bundler-pluginsuninstall-plugin)
* [`lens-tool-bundler plugins update`](#lens-tool-bundler-plugins-update)
* [`lens-tool-bundler test FILE`](#lens-tool-bundler-test-file)
* [`lens-tool-bundler upload FILE`](#lens-tool-bundler-upload-file)

## `lens-tool-bundler batch-bundle [DIRECTORY]`

Batch process and bundle multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-bundle [DIRECTORY] [-e <value>] [-f] [-d] [-s] [--source-encoding <value>]

ARGUMENTS
  [DIRECTORY]  [default: .] directory containing lenses to bundle

FLAGS
  -d, --skip-date        do not update the date field when bundling
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --force            force bundle all lenses even if content is up to date
  -s, --skip-valid       skip lenses that already have valid base64 content
  --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and bundle multiple lenses in a directory.

EXAMPLES
  $ lens-tool-bundler batch-bundle

  $ lens-tool-bundler batch-bundle ./lenses

  $ lens-tool-bundler batch-bundle ./lenses --skip-valid

  $ lens-tool-bundler batch-bundle ./lenses --skip-date

  $ lens-tool-bundler batch-bundle ./lenses --exclude "test.*"
```

_See code: [src/commands/batch-bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/batch-bundle.ts)_

## `lens-tool-bundler batch-check [DIRECTORY]`

Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

```
USAGE
  $ lens-tool-bundler batch-check [DIRECTORY] [-j] [-q] [--source-encoding <value>]

ARGUMENTS
  [DIRECTORY]  [default: .] directory to search for lens files

FLAGS
  -j, --json   output results as JSON
  -q, --quiet  suppress output, only return exit code
  --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch check integrity between all lens JavaScript files and their FHIR Library bundles.

EXAMPLES
  $ lens-tool-bundler batch-check

  $ lens-tool-bundler batch-check ./lenses

  $ lens-tool-bundler batch-check -q

  $ lens-tool-bundler batch-check --json
```

_See code: [src/commands/batch-check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/batch-check.ts)_

## `lens-tool-bundler batch-test [DIRECTORY]`

Batch test multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-test [DIRECTORY] [-e <value>] [-f] [-v]

ARGUMENTS
  [DIRECTORY]  [default: .] directory containing lenses to test

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

_See code: [src/commands/batch-test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/batch-test.ts)_

## `lens-tool-bundler batch-upload [DIRECTORY]`

Batch process and upload multiple lenses to a FHIR server.

```
USAGE
  $ lens-tool-bundler batch-upload [DIRECTORY] -d <value> [-e <value>] [-f] [-t] [-s] [--source-encoding <value>]

ARGUMENTS
  [DIRECTORY]  [default: .] directory containing lenses to upload

FLAGS
  -d, --domain=<value>   (required) domain where FHIR server is hosted (with http/https)
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --force            force bundle all lenses even if content is up to date
  -s, --skip-valid       skip lenses that already have valid base64 content
  -t, --skip-date        do not update the date field when bundling
  --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Batch process and upload multiple lenses to a FHIR server.

EXAMPLES
  $ lens-tool-bundler batch-upload -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --skip-valid

  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --exclude "test.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/batch-upload.ts)_

## `lens-tool-bundler bundle FILE`

Bundles raw lenses into a FHIR compliant single file.

```
USAGE
  $ lens-tool-bundler bundle FILE [-d] [-n <value>] [-p] [-u] [--source-encoding <value>]

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --default       use default values for the bundle
  -n, --name=<value>  name to apply to lens
  -p, --package-json  use values from package.json to populate FHIR library
  -u, --update        update existing bundle file (content and date only)
  --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Bundles raw lenses into a FHIR compliant single file.

EXAMPLES
  $ lens-tool-bundler bundle lens.js -n my-lens

  $ lens-tool-bundler bundle lens.js -n my-lens -d

  $ lens-tool-bundler bundle lens.js -p

  $ lens-tool-bundler bundle lens.js -u
```

_See code: [src/commands/bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/bundle.ts)_

## `lens-tool-bundler check FILE`

Check integrity between JavaScript file and FHIR Library bundle content.

```
USAGE
  $ lens-tool-bundler check FILE [-b <value>] [-n <value>] [-q] [--source-encoding <value>]

ARGUMENTS
  FILE  JavaScript file to check

FLAGS
  -b, --bundle=<value>  path to the bundle file to check
  -n, --name=<value>    name of the bundle to check (without .json extension)
  -q, --quiet           suppress output, only return exit code
  --source-encoding=<value>  source file encoding (auto-detected if omitted)

DESCRIPTION
  Check integrity between JavaScript file and FHIR Library bundle content.

EXAMPLES
  $ lens-tool-bundler check mylens.js

  $ lens-tool-bundler check mylens.js -n MyLens

  $ lens-tool-bundler check mylens.js -b MyLens.json
```

_See code: [src/commands/check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/check.ts)_

## `lens-tool-bundler help [COMMAND]`

Display help for lens-tool-bundler.

```
USAGE
  $ lens-tool-bundler help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for lens-tool-bundler.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.37/src/commands/help.ts)_

## `lens-tool-bundler lsenhancejs [DIRECTORY]`

List valid enhance JavaScript files in a directory (similar to ls).

```
USAGE
  $ lens-tool-bundler lsenhancejs [DIRECTORY] [-d] [-j]

ARGUMENTS
  [DIRECTORY]  [default: .] directory to search for enhance JS files

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

_See code: [src/commands/lsenhancejs.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/lsenhancejs.ts)_

## `lens-tool-bundler lslens [DIRECTORY]`

List valid FHIR lenses in a directory (similar to ls).

```
USAGE
  $ lens-tool-bundler lslens [DIRECTORY] [-a] [-j] [-v]

ARGUMENTS
  [DIRECTORY]  [default: .] directory to search for lenses

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

_See code: [src/commands/lslens.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/lslens.ts)_

## `lens-tool-bundler new NAME`

Creates a new lens with JavaScript file and FHIR bundle.

```
USAGE
  $ lens-tool-bundler new NAME [-d] [-f] [--fork] [-t]

ARGUMENTS
  NAME  name of the lens to create

FLAGS
  -d, --default   use default values for the bundle
  -f, --force     overwrite existing files if they exist
  -t, --template  clone the full lens-template repository with all features
      --fork      fork the template repository using GitHub CLI (requires gh CLI)

DESCRIPTION
  Creates a new lens with JavaScript file and FHIR bundle.

EXAMPLES
  $ lens-tool-bundler new MyLens

  $ lens-tool-bundler new MyLens -d

  $ lens-tool-bundler new MyLens --template

  $ lens-tool-bundler new MyLens --template --fork
```

_See code: [src/commands/new.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/new.ts)_

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/index.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
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
  $ lens-tool-bundler plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/inspect.ts)_

## `lens-tool-bundler plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ lens-tool-bundler plugins install PLUGIN...

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ lens-tool-bundler plugins add

EXAMPLES
  $ lens-tool-bundler plugins:install myplugin 

  $ lens-tool-bundler plugins:install https://github.com/someuser/someplugin

  $ lens-tool-bundler plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/install.ts)_

## `lens-tool-bundler plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ lens-tool-bundler plugins link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ lens-tool-bundler plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/link.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  [PLUGIN]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins uninstall PLUGIN...

ARGUMENTS
  [PLUGIN]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/uninstall.ts)_

## `lens-tool-bundler plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ lens-tool-bundler plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  [PLUGIN]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ lens-tool-bundler plugins unlink
  $ lens-tool-bundler plugins remove
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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.1.0/src/commands/plugins/update.ts)_

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

_See code: [src/commands/test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/test.ts)_

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

_See code: [src/commands/upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.5.2/src/commands/upload.ts)_
<!-- commandsstop -->
