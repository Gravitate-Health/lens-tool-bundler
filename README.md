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
@gravitate-health/lens-tool-bundler/0.2.1 linux-x64 node-v20.10.0
$ lens-tool-bundler --help [COMMAND]
USAGE
  $ lens-tool-bundler COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`lens-tool-bundler batch-bundle [DIRECTORY]`](#lens-tool-bundler-batch-bundle-directory)
* [`lens-tool-bundler batch-upload [DIRECTORY]`](#lens-tool-bundler-batch-upload-directory)
* [`lens-tool-bundler bundle FILE`](#lens-tool-bundler-bundle-file)
* [`lens-tool-bundler lsenhancejs [DIRECTORY]`](#lens-tool-bundler-lsenhancejs-directory)
* [`lens-tool-bundler lslens [DIRECTORY]`](#lens-tool-bundler-lslens-directory)
* [`lens-tool-bundler new NAME`](#lens-tool-bundler-new-name)
* [`lens-tool-bundler upload FILE`](#lens-tool-bundler-upload-file)

## `lens-tool-bundler bundle FILE`

Bundles raw lenses into a FHIR compliant single file.

```
USAGE
  $ lens-tool-bundler bundle FILE -n <value> [-d] [-u]

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --default       use default values for the bundle
  -n, --name=<value>  (required) name to apply to lens
  -u, --update        update existing bundle file (content and date only)

DESCRIPTION
  Bundles raw lenses into a FHIR compliant single file.
  
  By default, the command runs in interactive mode, prompting for bundle metadata.
  Use -d flag to skip prompts and use default values.
  Use -u flag to update an existing bundle file with new content and updated date.

EXAMPLES
  $ lens-tool-bundler bundle mylens.js -n MyLens
  $ lens-tool-bundler bundle mylens.js -n MyLens -d
  $ lens-tool-bundler bundle mylens.js -n MyLens -u
```

_See code: [src/commands/bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/bundle.ts)_

## `lens-tool-bundler batch-bundle [DIRECTORY]`

Batch process and bundle multiple lenses in a directory.

```
USAGE
  $ lens-tool-bundler batch-bundle [DIRECTORY] [-s] [-d] [-e <value>] [-f]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to bundle

FLAGS
  -d, --skip-date   do not update the date field when bundling
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --force       force bundle all lenses even if content is up to date
  -s, --skip-valid  skip lenses that already have valid base64 content

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
  $ lens-tool-bundler batch-bundle ./lenses -s -d -e "draft.*"
```

_See code: [src/commands/batch-bundle.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/batch-bundle.ts)_

## `lens-tool-bundler batch-upload [DIRECTORY]`

Batch process, bundle, and upload multiple lenses to a FHIR server.

```
USAGE
  $ lens-tool-bundler batch-upload [DIRECTORY] -d <value> [-s] [-t] [-e <value>] [-f]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to upload

FLAGS
  -d, --domain=<value>  (required) domain where FHIR server is hosted (with http/https)
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --force           force bundle all lenses even if content is up to date
  -s, --skip-valid      skip lenses that already have valid base64 content
  -t, --skip-date       do not update the date field when bundling

DESCRIPTION
  Batch process, bundle, and upload multiple lenses to a FHIR server.
  
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
  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir -s -t -e "draft.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/batch-upload.ts)_

## `lens-tool-bundler bundle FILE`

Bundles raw JavaScript with metadata into a FHIR-compliant JSON file.

```
USAGE
  $ lens-tool-bundler batch-upload [DIRECTORY] -d <value> [-s] [-t] [-e <value>] [-f]

ARGUMENTS
  DIRECTORY  [default: .] directory containing lenses to upload

FLAGS
  -d, --domain=<value>  (required) domain where FHIR server is hosted (with http/https)
  -e, --exclude=<value>  regex pattern to exclude files (applied to filename)
  -f, --force           force bundle all lenses even if content is up to date
  -s, --skip-valid      skip lenses that already have valid base64 content
  -t, --skip-date       do not update the date field when bundling

DESCRIPTION
  Batch process, bundle, and upload multiple lenses to a FHIR server.
  
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
  $ lens-tool-bundler batch-upload ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir -s -t -e "draft.*"
```

_See code: [src/commands/batch-upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/batch-upload.ts)_

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

_See code: [src/commands/lsenhancejs.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/lsenhancejs.ts)_

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

_See code: [src/commands/lslens.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/lslens.ts)_

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

_See code: [src/commands/new.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/new.ts)_


## `lens-tool-bundler upload FILE`

upload file (json format) to a valid FHIR server.

```
USAGE
  $ lens-tool-bundler upload FILE -d <value>

ARGUMENTS
  FILE  file to read

FLAGS
  -d, --domain=<value>  (required) domain where FHIR server is hoste (with http/https)

DESCRIPTION
  upload file (json format) to a valid FHIR server.

EXAMPLES
  $ lens-tool-bundler upload
```

_See code: [src/commands/upload.ts](https://github.com/Gravitate-Health/lens-tool-bundler/blob/v0.2.1/src/commands/upload.ts)_