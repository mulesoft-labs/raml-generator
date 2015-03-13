require('es6-promise').polyfill()

var resolve = require('path').resolve
var dirname = require('path').dirname
var thenify = require('thenify')
var ramlParser = require('raml-parser')
var mkdirp = thenify(require('mkdirp'))
var readFile = thenify(require('fs').readFile)
var writeFile = thenify(require('fs').writeFile)
var cwd = process.cwd()

/**
 * Expose the `bin` function.
 */
module.exports = bin

/**
 * Run the `bin` command for a consumer of the generator.
 *
 * @param  {Function} generator
 * @param  {Object}   pkg
 * @return {Function}
 */
function bin (generator, pkg, argv) {
  var opts = require('yargs')
    .usage(pkg.description + '\n\n$0 api.raml --output api-client')
    .version(pkg.version, 'version')
    .demand('o')
    .alias('o', 'output')
    .describe('o', 'Output directory')
    .alias('d', 'data')
    .describe('d', 'Provide the path to JSON package information')
    .parse(argv)

  return ramlParser.loadFile(opts._[2])
    .then(function (raml) {
      var datafile = opts.data && resolve(cwd, opts.data)

      return readData(datafile)
        .then(function (data) {
          return generator(raml, data)
        })
    })
    .then(function (output) {
      return objectToFs(resolve(cwd, opts.output), output.files)
    })
    .then(function () {
      return process.exit(0)
    })
    .catch(function (err) {
      console.error(err instanceof Error ? (err.stack || err.message) : err)

      return process.exit(1)
    })
}

/**
 * Read a configuration file.
 *
 * @param  {String}  filename
 * @return {Promise}
 */
function readData (filename) {
  if (!filename) {
    return Promise.resolve({})
  }

  return readFile(filename, 'utf8')
    .then(function (content) {
      try {
        return JSON.parse(content)
      } catch (e) {
        return Promise.reject(new Error('Invalid JSON configuration at ' + filename))
      }
    })
}

/**
 * Save on object structure to the file system.
 *
 * @param  {String}  dir
 * @param  {Object}  object
 * @return {Promise}
 */
function objectToFs (dir, object) {
  return Object.keys(object).reduce(function (promise, file) {
    var content = object[file]
    var filename = resolve(dir, file)
    var output = dirname(filename)

    return promise
      .then(function () {
        return mkdirp(output)
      })
      .then(function () {
        return writeFile(filename, content)
      })
  }, mkdirp(dir))
}
