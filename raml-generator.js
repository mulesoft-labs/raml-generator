var xtend = require('xtend')
var RamlObject = require('raml-object-interface')
var Handlebars = require('handlebars')
var libHelpers = require('./lib/helpers')

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
  var helpers = xtend(libHelpers, spec.helpers)
  var partials = compile(spec.partials, helpers)
  var templates = compile(spec.templates, helpers)
  var createFiles = spec.files || templatesToFiles

  return function (raml, data) {
    var context = createContext(raml)

    var options = {
      data: context,
      helpers: helpers,
      partials: partials
    }

    var files = createFiles(templates, data, options)

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
        strict: true,
        knownHelpers: helpers
      })
    })
  }

  return templates
}

/**
 * Create the generator context object.
 *
 * @param  {Object} raml
 * @return {Object}
 */
function createContext (raml) {
  var interface = new RamlObject(raml)
  var context = {}

  Object.keys(RamlObject.prototype).forEach(function (key) {
    context[key] = interface[key].bind(interface)
  })

  return context
}
