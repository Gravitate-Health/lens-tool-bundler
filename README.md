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
@gravitate-health/lens-tool-bundler/0.3.0
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
  
  Automatically discovers lenses (valid or missing content) and their corresponding
  JavaScript files, then bundles them together. For each lens:
  - If it's missing content, adds the JS code as base64
  - If it has content, checks if it needs updating against the JS file
  - Updates the date field (unless --skip-date is used)
  
  The command uses exact matching (same filename) or fallback matching (any JS 
  file in the same directory with an enhance function) to find the appropriate
  JavaScript code for each lens.
  
  The --force flag bypasses the content check and bundles all lenses regardless 
  of whether their content is already up to date. This overrides --skip-valid.

EXAMPLES
  $ lens-tool-bundler batch-bundle
  $ lens-tool-bundler batch-bundle ./lenses
  $ lens-tool-bundler batch-bundle ./lenses --skip-valid
  $ lens-tool-bundler batch-bundle ./lenses --force
  $ lens-tool-bundler batch-bundle ./lenses --skip-date
  $ lens-tool-bundler batch-bundle ./lenses --exclude "test.*"
```

_See code: [src/commands/batch-bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/batch-bundle.ts)_

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
  
  Automatically discovers all lens JavaScript files (files containing an enhance function)
  in the specified directory and checks if their corresponding JSON bundles are up-to-date.
  The command assumes the bundle file has the same name as the JS file but with .json extension.
  
  Exit codes:
  - 0: All integrity checks passed
  - 1: One or more integrity checks failed
  - 2: Error during check (e.g., directory not found)
  
  This command is designed for CI/CD pipelines to verify that all lens bundles are
  synchronized with their source JavaScript files before deployment.

EXAMPLES
  $ lens-tool-bundler batch-check
  $ lens-tool-bundler batch-check ./lenses
  $ lens-tool-bundler batch-check -q
  $ lens-tool-bundler batch-check --json
  
  # In GitHub Actions workflow
  $ lens-tool-bundler batch-check || exit 1
```

_See code: [src/commands/batch-check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/batch-check.ts)_

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
  
  Discovers all FHIR Library bundles in the specified directory and runs
  comprehensive tests on each lens using the @gravitate-health/lens-tool-test
  package. Tests verify:
  - Content preservation (that important information isn't lost)
  - Focusing functionality (that lenses properly highlight relevant content)
  - Lens execution without errors
  
  Exit codes:
  - 0: All tests passed
  - 1: One or more tests failed
  
  The --fail-fast flag stops testing immediately on the first failure,
  useful for quick validation in CI/CD pipelines.

EXAMPLES
  $ lens-tool-bundler batch-test
  $ lens-tool-bundler batch-test ./lenses
  $ lens-tool-bundler batch-test ./lenses --exclude "test.*"
  $ lens-tool-bundler batch-test ./lenses --verbose
  $ lens-tool-bundler batch-test ./lenses --fail-fast
```

_See code: [src/commands/batch-test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/batch-test.ts)_

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
  
  This command combines the functionality of batch-bundle and upload. It discovers
  all lens JSON files in the specified directory, bundles them with their corresponding
  JavaScript files, and uploads them to a FHIR server. For each lens:
  - Finds the corresponding JS file (exact or fallback match)
  - Updates the content with base64-encoded JavaScript
  - Updates the date field (unless --skip-date is used)
  - Uploads to the FHIR server via POST (new) or PATCH (existing)
  
  The command uses the same matching logic as batch-bundle and the same upload
  logic as the upload command.

EXAMPLES
  $ lens-tool-bundler batch-upload -d https://fosps.gravitatehealth.eu/epi/api/fhir
  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir
  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --skip-valid
  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --force
  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --exclude "test.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/batch-upload.ts)_

## `lens-tool-bundler bundle FILE`

Bundles raw lenses into a FHIR compliant single file.

```
USAGE
  $ lens-tool-bundler bundle FILE [-n <value>] [-d] [-u] [-p]

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --default        use default values for the bundle
  -n, --name=<value>   name to apply to lens (required unless using -p or -u)
  -p, --package-json   use values from package.json to populate FHIR library
  -u, --update         update existing bundle file (content and date only)

DESCRIPTION
  Bundles raw lenses into a FHIR compliant single file.
  
  By default, the command runs in interactive mode, prompting for bundle metadata.
  Use -d flag to skip prompts and use default values.
  Use -p flag to automatically populate bundle metadata from package.json (name, version, 
  description, author, license). This flag is incompatible with -d and -n flags.
  Use -u flag to update an existing bundle file with new content and updated date. When using
  -u without -n or -p, the command will automatically find and update the existing bundle.

EXAMPLES
  $ lens-tool-bundler bundle mylens.js -n MyLens
  $ lens-tool-bundler bundle mylens.js -n MyLens -d
  $ lens-tool-bundler bundle mylens.js -n MyLens -u
  $ lens-tool-bundler bundle mylens.js -p
  $ lens-tool-bundler bundle mylens.js -p -u
  $ lens-tool-bundler bundle mylens.js -u
```

_See code: [src/commands/bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/bundle.ts)_

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
  
  Verifies that the base64-encoded content in a FHIR Library bundle matches the
  JavaScript file. This is useful for CI/CD pipelines to ensure bundles are
  up-to-date before deployment.
  
  Exit codes:
  - 0: Integrity check passed (content matches)
  - 1: Integrity check failed (content mismatch)
  - 2: Error during check (file not found, invalid bundle, etc.)
  
  By default, the command auto-detects the bundle by looking for a JSON file
  with the same name as the JS file, or any FHIR Library bundle in the same
  directory. Use -n or -b flags to specify a particular bundle.

EXAMPLES
  $ lens-tool-bundler check mylens.js
  $ lens-tool-bundler check mylens.js -n MyLens
  $ lens-tool-bundler check mylens.js -b path/to/MyLens.json
  $ lens-tool-bundler check mylens.js -q
  
  # In GitHub Actions workflow
  $ lens-tool-bundler check mylens.js || exit 1
```

_See code: [src/commands/check.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/check.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/main/src/commands/help.ts)_

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
  
  Finds JavaScript files that contain an enhance function definition.
  Files are categorized as:
  - Exact match: JS file has the same name as a corresponding JSON lens file
  - Fallback: JS file in same directory but no matching JSON file name
  
  Default output shows just file paths, making it ideal for piping to xargs.

EXAMPLES
  $ lens-tool-bundler lsenhancejs
  $ lens-tool-bundler lsenhancejs ./lenses
  $ lens-tool-bundler lsenhancejs -d
  $ lens-tool-bundler lsenhancejs ./lenses | xargs -I {} echo "Processing: {}"
```

_See code: [src/commands/lsenhancejs.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/lsenhancejs.ts)_

## `lens-tool-bundler lslens [DIRECTORY]`

List valid FHIR lenses in a directory (similar to ls).

```
USAGE
  $ lens-tool-bundler lslens [DIRECTORY] [-a] [-v] [-j]

ARGUMENTS
  DIRECTORY  [default: .] directory to search for lenses

FLAGS
  -a, --all       include lenses that may be missing content (base64 data)
  -j, --json      output as JSON format
  -v, --validate  include full validation report for each lens

DESCRIPTION
  List valid FHIR lenses in a directory (similar to ls).
  
  By default, only lists fully-fledged lenses with complete base64 content.
  Use -a to include lenses that may be missing content.
  Use -v to show detailed validation reports.
  Use -j for JSON output (useful for scripting).
  
  Default output shows just file paths, making it ideal for piping to xargs.

EXAMPLES
  $ lens-tool-bundler lslens
  $ lens-tool-bundler lslens ./lenses
  $ lens-tool-bundler lslens -a
  $ lens-tool-bundler lslens -v
  $ lens-tool-bundler lslens ./lenses | xargs -I {} echo "Processing: {}"
```

_See code: [src/commands/lslens.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/lslens.ts)_

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
  
  Creates two files:
  - <name>.js: JavaScript file with lens template from GitHub repository
  - <name>.json: FHIR-compliant bundle with the JS code encoded in base64
  
  By default, the command runs in interactive mode, prompting for bundle metadata.
  Use -d flag to skip prompts and use default values.
  Use -f flag to overwrite existing files.
  
  The JavaScript template is fetched from the Gravitate Health lens template 
  repository at runtime, ensuring you always get the latest version.

EXAMPLES
  $ lens-tool-bundler new MyLens
  $ lens-tool-bundler new MyLens -d
  $ lens-tool-bundler new MyLens -d -f
```

_See code: [src/commands/new.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/new.ts)_

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
  
  Runs comprehensive tests on a FHIR Library bundle using the
  @gravitate-health/lens-tool-test package. Tests verify:
  - Content preservation: Ensures important information isn't lost
  - Focusing functionality: Verifies lenses properly highlight relevant content
  - Lens execution: Confirms the lens runs without errors
  - Metrics: Reports preservation percentages and focusing statistics
  
  Exit codes:
  - 0: All tests passed
  - 1: One or more tests failed
  
  The verbose flag provides detailed information about each test including
  EPI/IPS identifiers, lens names, and preservation metrics.

EXAMPLES
  $ lens-tool-bundler test my-lens.json
  $ lens-tool-bundler test ./lenses/enhance-lens.json
  $ lens-tool-bundler test my-lens.json --verbose
  
  # In GitHub Actions workflow
  $ lens-tool-bundler test my-lens.json || exit 1
```

_See code: [src/commands/test.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/test.ts)_

## `lens-tool-bundler upload FILE`

Upload file (JSON format) to a valid FHIR server.

```
USAGE
  $ lens-tool-bundler upload FILE -d <value>

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --domain=<value>  (required) domain where FHIR server is hosted (with http/https)

DESCRIPTION
  Upload file (JSON format) to a valid FHIR server.
  
  Uploads a FHIR Library bundle to a FHIR server. If a resource with the same name
  already exists, it will be updated (PATCH). Otherwise, a new resource will be
  created (POST).

EXAMPLES
  $ lens-tool-bundler upload mylens.json -d https://fosps.gravitatehealth.eu/epi/api/fhir
```

_See code: [src/commands/upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/main/src/commands/upload.ts)_

<!-- commandsstop -->
