var extend = require('extend')
var Handlebars = require('handlebars')
var libHelpers = require('./lib/helpers')
var libContext = require('./lib/context')

/**
 * Expose the generator.
 */
module.exports = generator

/**
 * Create a generator from a language spec.
 *
 * @param  {Object}   spec
 * @return {Function}
 */
function generator (spec) {
  var helpers = extend(libHelpers, spec.helpers)
  var partials = compile(spec.partials, helpers)
  var templates = compile(spec.templates, helpers)
  var createFiles = spec.files || templatesToFiles

  return function (raml, data) {
    var context = libContext(raml)

    var options = {
      data: data,
      helpers: helpers,
      partials: partials
    }

    var files = createFiles(templates, context, options)

    // Create the compile object. We resolve this object instead of just the
    // files so that external utilities have access to the context object. For
    // example, the "API Notebook" project needs to add runtime documentation.
    return {
      files: files,
      context: context,
      options: options
    }
  }
}

/**
 * Compile templates into files.
 *
 * @param  {Object} templates
 * @param  {Object} context
 * @param  {Object} options
 * @return {Object}
 */
function templatesToFiles (templates, context, options) {
  var files = {}

  Object.keys(templates).forEach(function (key) {
    files[key] = templates[key](context, options)
  })

  return files
}

/**
 * Compile a map of templates using Handlebars.
 *
 * @param  {Object} obj
 * @param  {Object} helpers
 * @return {Object}
 */
function compile (obj, helpers) {
  var templates = {}

  if (obj) {
    Object.keys(obj).forEach(function (key) {
      templates[key] = Handlebars.compile(obj[key], {
        noEscape: true,
        knownHelpers: helpers
      })
    })
  }

  return templates
}
